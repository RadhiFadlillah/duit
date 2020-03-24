package ui

import (
	"net/http"
	"path"
	fp "path/filepath"
	"strings"

	"github.com/RadhiFadlillah/duit/internal/backend/auth"
	"github.com/jmoiron/sqlx"
	"github.com/julienschmidt/httprouter"
)

var developmentMode = false

// Handler represents handler for every UI routes.
type Handler struct {
	db   *sqlx.DB
	auth *auth.Authenticator
}

// NewHandler returns new Handler
func NewHandler(db *sqlx.DB, auth *auth.Authenticator) (*Handler, error) {
	// Create handler
	handler := new(Handler)
	handler.db = db
	handler.auth = auth
	return handler, nil
}

// ServeFile serves general UI file
func (h *Handler) ServeFile(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	currentEtag := r.Header.Get("If-None-Match")
	err := serveAssets(w, r.URL.Path, currentEtag)
	checkError(err)
}

// ServeJsFile serves all JS file
func (h *Handler) ServeJsFile(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	jsFilePath := ps.ByName("filepath")
	jsFilePath = path.Join("js", jsFilePath)
	jsDir, jsName := path.Split(jsFilePath)

	if developmentMode && fp.Ext(jsName) == ".js" && strings.HasSuffix(jsName, ".min.js") {
		jsName = strings.TrimSuffix(jsName, ".min.js") + ".js"
		tmpPath := path.Join(jsDir, jsName)
		if assetExists(tmpPath) {
			jsFilePath = tmpPath
		}
	}

	currentEtag := r.Header.Get("If-None-Match")
	err := serveAssets(w, jsFilePath, currentEtag)
	checkError(err)
}

// ServeIndex serves the index page
func (h *Handler) ServeIndex(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// If there is no active session, go to login
	err := h.auth.AuthenticateUser(r)
	if err != nil {
		redirectPage(w, r, "/login")
		return
	}

	// If it's first run move to register page
	if h.isFirstRun() {
		redirectPage(w, r, "/register")
		return
	}

	// Serve index file
	currentEtag := r.Header.Get("If-None-Match")
	err = serveAssets(w, "index.html", currentEtag)
	checkError(err)
}

// ServeLogin serves the login page
func (h *Handler) ServeLogin(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// If there is active session, go to index
	err := h.auth.AuthenticateUser(r)
	if err == nil {
		redirectPage(w, r, "/")
		return
	}

	// If it's first run move to register page
	if h.isFirstRun() {
		redirectPage(w, r, "/register")
		return
	}

	// Serve login file
	currentEtag := r.Header.Get("If-None-Match")
	err = serveAssets(w, "login.html", currentEtag)
	checkError(err)
}

// ServeRegister serves the register page
func (h *Handler) ServeRegister(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// If it's not first run move to index page
	if !h.isFirstRun() {
		redirectPage(w, r, "/")
		return
	}

	// Serve register file
	currentEtag := r.Header.Get("If-None-Match")
	err := serveAssets(w, "register.html", currentEtag)
	checkError(err)
}

// isFirstRun check if there are no admin registered
func (h *Handler) isFirstRun() bool {
	var nAdmin int
	h.db.Get(&nAdmin, `SELECT COUNT(id) FROM user WHERE admin = 1`)
	return nAdmin == 0
}
