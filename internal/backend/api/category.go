package api

import (
	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/julienschmidt/httprouter"
	"net/http"
)

// SelectCategories is handler for GET /api/categories
func (h *Handler) SelectCategories(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Get URL parameter
	accountID := strToInt(r.URL.Query().Get("account"))

	// Start transaction
	// We only use it to fetch the data,
	// so just rollback it later
	tx := h.db.MustBegin()
	defer tx.Rollback()

	// Prepare SQL statement
	stmtSelectCategories, err := tx.Preparex(`SELECT name, type FROM category WHERE account_id = ? ORDER BY name`)
	checkError(err)

	// Fetch categories from database
	categories := []model.Category{}
	err = stmtSelectCategories.Select(&categories, accountID)
	checkError(err)

	// Return list of categories
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &categories)
	checkError(err)
}
