package api

import (
	"encoding/json"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

// Login is handler for POST /api/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Decode request
	var request struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	checkError(err)

	// Login using the authenticator
	session, user, err := h.auth.Login(request.Username, request.Password)
	checkError(err)

	// Send login result
	loginResult := map[string]interface{}{}
	loginResult["session"] = session
	if user.ID != 0 && user.Username != "" {
		loginResult["user"] = user
	}

	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Set("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &loginResult)
	checkError(err)
}

// Logout is handler for POST /api/logout
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	err := h.auth.Logout(r)
	checkError(err)
}
