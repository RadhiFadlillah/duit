package ui

import (
	"net/http"
	"path"
	fp "path/filepath"
	"strings"

	"github.com/RadhiFadlillah/duit/internal/backend/auth"
	"github.com/julienschmidt/httprouter"
)

var developmentMode = false

// Handler represents handler for every UI routes.
type Handler struct {
	auth *auth.Authenticator
}

// NewHandler returns new Handler
func NewHandler(auth *auth.Authenticator) (*Handler, error) {
	// Create handler
	handler := new(Handler)
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
	// Check if there is active session
	err := h.auth.AuthenticateUser(r)
	if err != nil {
		redirectPage(w, r, "/login")
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

	// Serve login file
	currentEtag := r.Header.Get("If-None-Match")
	err = serveAssets(w, "login.html", currentEtag)
	checkError(err)
}
