package api

import (
	"encoding/json"
	"net/http"

	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/julienschmidt/httprouter"
)

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

	// Save to database
	res := tx.MustExec(`INSERT INTO entry 
		(account_id, affected_account_id, entry_type, description, amount, entry_date)
		VALUES (?, ?, ?, ?, ?, ?)`,
		entry.AccountID,
		entry.AffectedAccountID,
		entry.EntryType,
		entry.Description,
		entry.Amount,
		entry.EntryDate)
	entry.ID, _ = res.LastInsertId()

	// Commit transaction
	err = tx.Commit()
	checkError(err)

	// Return inserted account
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &entry)
	checkError(err)
}
