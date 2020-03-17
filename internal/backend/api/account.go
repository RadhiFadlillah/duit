package api

import (
	"encoding/json"
	"net/http"

	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/julienschmidt/httprouter"
)

const sqlSelectAccount = `
WITH income AS (
	SELECT account_id id, SUM(amount) amount FROM entry
	WHERE type = 1
	GROUP BY account_id),
expense AS (
	SELECT account_id id, SUM(amount) amount FROM entry
	WHERE type = 2
	GROUP BY account_id),
moved AS (
	SELECT account_id id, SUM(amount) amount FROM entry
	WHERE type = 3
	GROUP BY account_id),
received AS (
	SELECT affected_account_id id, SUM(amount) amount FROM entry
	WHERE type = 3
	GROUP BY affected_account_id)
SELECT a.id, a.name, a.initial_amount,
	a.initial_amount + 
	IFNULL(i.amount, 0) - 
	IFNULL(e.amount, 0) - 
	IFNULL(m.amount, 0) + 
	IFNULL(r.amount, 0) total
FROM account a
LEFT JOIN income i ON i.id = a.id
LEFT JOIN expense e ON e.id = a.id
LEFT JOIN moved m ON m.id = a.id
LEFT JOIN received r ON r.id = a.id`

// SelectAccounts is handler for GET /api/accounts
func (h *Handler) SelectAccounts(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Start transaction
	// We only use it to fetch the data,
	// so just rollback it later
	tx := h.db.MustBegin()
	defer tx.Rollback()

	// Prepare SQL statement
	stmtSelectAccounts, err := tx.Preparex(sqlSelectAccount + ` ORDER BY a.name`)
	checkError(err)

	// Fetch from database
	accounts := []model.Account{}
	err = stmtSelectAccounts.Select(&accounts)
	checkError(err)

	// Return accounts
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &accounts)
	checkError(err)
}

// InsertAccount is handler for POST /api/account
func (h *Handler) InsertAccount(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Decode request
	var account model.Account
	err := json.NewDecoder(r.Body).Decode(&account)
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

	// Save to database
	res := tx.MustExec(`INSERT INTO account (name, initial_amount) VALUES (?, ?)`,
		account.Name, account.InitialAmount)
	account.ID, _ = res.LastInsertId()

	// Commit transaction
	err = tx.Commit()
	checkError(err)

	// Return inserted account
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &account)
	checkError(err)
}

// UpdateAccount is handler for PUT /api/account
func (h *Handler) UpdateAccount(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Decode request
	var account model.Account
	err := json.NewDecoder(r.Body).Decode(&account)
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

	// Update database
	tx.MustExec(`UPDATE account 
		SET name = ?, initial_amount = ? WHERE id = ?`,
		account.Name, account.InitialAmount, account.ID)

	// Fetch the updated account
	err = tx.Get(&account, sqlSelectAccount+` WHERE a.id = ?`, account.ID)
	checkError(err)

	// Commit transaction
	err = tx.Commit()
	checkError(err)

	// Return updated account
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &account)
	checkError(err)
}

// DeleteAccounts is handler for DELETE /api/accounts
func (h *Handler) DeleteAccounts(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
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
	stmt, err := tx.Preparex(`DELETE FROM account WHERE id = ?`)
	checkError(err)

	for _, id := range ids {
		stmt.MustExec(id)
	}

	// Commit transaction
	err = tx.Commit()
	checkError(err)
}
