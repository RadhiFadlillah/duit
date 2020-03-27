package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/jmoiron/sqlx"
	"github.com/julienschmidt/httprouter"
	"gopkg.in/guregu/null.v3"
	"net/http"
)

// SelectEntries is handler for GET /api/entries
func (h *Handler) SelectEntries(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Get URL parameter
	page := strToInt(r.URL.Query().Get("page"))
	accountID := strToInt(r.URL.Query().Get("account"))

	// Start transaction
	// We only use it to fetch the data,
	// so just rollback it later
	tx := h.db.MustBegin()
	defer tx.Rollback()

	// Prepare SQL statement
	stmtGetAccount, err := tx.Preparex(`SELECT id FROM account WHERE id = ?`)
	checkError(err)

	stmtGetEntriesMaxPage, err := tx.Preparex(`
		SELECT CEIL(COUNT(*) / ?) FROM entry
		WHERE account_id = ?
		OR affected_account_id = ?`)
	checkError(err)

	stmtSelectEntries, err := tx.Preparex(`
		SELECT e.id, e.account_id, e.affected_account_id,
			a1.name account, a2.name affected_account,
			e.type, e.description, c.name AS category, e.amount, e.date
		FROM entry e
		LEFT JOIN account a1 ON e.account_id = a1.id
		LEFT JOIN account a2 ON e.affected_account_id = a2.id
		LEFT JOIN category c ON e.category = c.id
		WHERE e.account_id = ?
		OR e.affected_account_id = ?
		ORDER BY e.date DESC, e.id DESC
		LIMIT ? OFFSET ?`)
	checkError(err)

	// Make sure account exist
	var tmpID int64
	err = stmtGetAccount.Get(&tmpID, accountID)
	checkError(err)

	if err == sql.ErrNoRows {
		panic(fmt.Errorf("account doesn't exist"))
	}

	// Get entry count and calculate max page
	var maxPage int
	err = stmtGetEntriesMaxPage.Get(&maxPage, pageLength,
		accountID, accountID)
	checkError(err)

	if page == 0 {
		page = 1
	} else if page > maxPage {
		page = maxPage
	}

	offset := (page - 1) * pageLength

	// Fetch entries from database
	entries := []model.Entry{}
	err = stmtSelectEntries.Select(&entries,
		accountID, accountID,
		pageLength, offset)
	checkError(err)

	// Return final result
	result := map[string]interface{}{
		"page":    page,
		"maxPage": maxPage,
		"entries": entries,
	}

	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &result)
	checkError(err)
}

// InsertEntry is handler for POST /api/entry
func (h *Handler) InsertEntry(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Decode request
	var entry model.Entry
	err := json.NewDecoder(r.Body).Decode(&entry)
	checkError(err)

	// Start transaction
	// Make sure to rollback if panic ever happened
	tx := h.db.MustBegin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Prepare statements
	stmtInsertEntry, err := tx.Preparex(`INSERT INTO entry 
		(account_id, affected_account_id, type, description, category, amount, date)
		VALUES (?, ?, ?, ?, ?, ?, ?)`)
	checkError(err)

	stmtGetEntry, err := tx.Preparex(`
		SELECT e.id, e.account_id, e.affected_account_id,
			a1.name account, a2.name affected_account,
			e.type, e.description, c.name AS category, e.amount, e.date
		FROM entry e
		LEFT JOIN account a1 ON e.account_id = a1.id
		LEFT JOIN account a2 ON e.affected_account_id = a2.id
		LEFT JOIN category c ON e.category = c.id
		WHERE e.id = ?`)
	checkError(err)

	// Save to database
	categoryID, err := createCategoryIfNotExists(tx, entry.AccountID, entry.Category)
	checkError(err)

	res := stmtInsertEntry.MustExec(
		entry.AccountID,
		entry.AffectedAccountID,
		entry.Type,
		entry.Description,
		categoryID,
		entry.Amount,
		entry.Date)
	entry.ID, _ = res.LastInsertId()

	// Fetch the inserted data
	err = stmtGetEntry.Get(&entry, entry.ID)
	checkError(err)

	// Commit transaction
	err = tx.Commit()
	checkError(err)

	// Return inserted entry
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &entry)
	checkError(err)
}

// UpdateEntry is handler for PUT /api/entry
func (h *Handler) UpdateEntry(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Decode request
	var entry model.Entry
	err := json.NewDecoder(r.Body).Decode(&entry)
	checkError(err)

	// Start transaction
	// Make sure to rollback if panic ever happened
	tx := h.db.MustBegin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Prepare statements
	stmtUpdateEntry, err := tx.Preparex(`UPDATE entry 
		SET affected_account_id = ?, description = ?, category = ?, amount = ?, date = ?
		WHERE id = ?`)
	checkError(err)

	stmtGetEntry, err := tx.Preparex(`
		SELECT e.id, e.account_id, e.affected_account_id,
			a1.name account, a2.name affected_account,
			e.type, e.description, c.name AS category, e.amount, e.date
		FROM entry e
		LEFT JOIN account a1 ON e.account_id = a1.id
		LEFT JOIN account a2 ON e.affected_account_id = a2.id
		LEFT JOIN category c ON e.category = c.id
		WHERE e.id = ?`)
	checkError(err)

	// Update database
	categoryID, err := createCategoryIfNotExists(tx, entry.AccountID, entry.Category)
	checkError(err)

	stmtUpdateEntry.MustExec(
		entry.AffectedAccountID, entry.Description,
		categoryID, entry.Amount, entry.Date, entry.ID)

	// Fetch the updated data
	err = stmtGetEntry.Get(&entry, entry.ID)
	checkError(err)

	// Commit transaction
	err = tx.Commit()
	checkError(err)

	// Return updated entry
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &entry)
	checkError(err)
}

// DeleteEntries is handler for DELETE /api/entries
func (h *Handler) DeleteEntries(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Decode request
	var ids []int
	err := json.NewDecoder(r.Body).Decode(&ids)
	checkError(err)

	// Start transaction
	// Make sure to rollback if panic ever happened
	tx := h.db.MustBegin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Delete from database
	stmt, err := tx.Preparex(`DELETE FROM entry WHERE id = ?`)
	checkError(err)

	for _, id := range ids {
		stmt.MustExec(id)
	}

	// Commit transaction
	err = tx.Commit()
	checkError(err)
}

func createCategoryIfNotExists(tx *sqlx.Tx, accountID int64, category null.String) (null.Int, error) {

	if len(category.ValueOrZero()) == 0 {
		return null.Int{}, nil
	}

	stmtSelectCategory, err := tx.Preparex(`
			SELECT id 
			FROM category
			WHERE account_id = ? AND name = ?`)
	checkError(err)

	var categoryID int64
	err = stmtSelectCategory.Get(&categoryID, accountID, category)

	if err == nil {
		return null.IntFrom(categoryID), nil
	}

	stmtInsertCategory, err := tx.Preparex(`
		INSERT INTO category (account_id, name) 
		VALUES (?, ?) `)
	checkError(err)

	res := stmtInsertCategory.MustExec(accountID, category)

	lastInsertedID, err := res.LastInsertId()
	checkError(err)

	return null.IntFrom(lastInsertedID), nil
}
