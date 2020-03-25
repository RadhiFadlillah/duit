package api

import (
	"net/http"
	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/julienschmidt/httprouter"
	_"encoding/json"
)

// SelectCategories is handler for GET /api/categories
func (h *Handler) SelectCategories(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Fetch from database
	categories := []model.Category{}
	err := h.db.Select(&categories,
		`SELECT name FROM category ORDER BY name`)
	checkError(err)

	// Return list of categories
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &categories)
	checkError(err)
}
