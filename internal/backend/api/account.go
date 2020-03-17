package api

import (
	"encoding/json"
	"net/http"

	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/julienschmidt/httprouter"
)

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
	stmtSelectAccounts, err := tx.Preparex(`
		SELECT id, name, initial_amount, total
		FROM account_total
		ORDER BY name`)
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
	err = tx.Get(&account, `
		SELECT id, name, initial_amount, total
		FROM account_total
		WHERE id = ?`,
		account.ID)
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
