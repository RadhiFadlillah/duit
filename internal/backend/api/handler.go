package api

import (
	"github.com/RadhiFadlillah/duit/internal/backend/auth"
	"github.com/jmoiron/sqlx"
)

const pageLength = 250

// Handler represents handler for every API routes.
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
