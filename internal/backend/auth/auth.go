package auth

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

// AuthenticationRules is function to check whether
// an user allowed to access an URL.
type AuthenticationRules func(user model.User, method, url string) bool

// Authenticator is object to authenticate a http request.
// It also handles login and logout.
type Authenticator struct {
	db             *sqlx.DB
	sessionManager *SessionManager
	rules          AuthenticationRules
}

// NewAuthenticator returns new Authenticator
func NewAuthenticator(db *sqlx.DB, rules AuthenticationRules) (*Authenticator, error) {
	// Create authenticator
	auth := new(Authenticator)
	auth.db = db
	auth.sessionManager = NewSessionManager(3*time.Hour, 10*time.Minute)
	auth.rules = rules

	return auth, nil
}

// Login verify that username and password match,
// generate session ID then save it to cache.
func (auth *Authenticator) Login(username, password string) (string, model.User, error) {
	emptyUser := model.User{}

	// Start transaction
	// We only use it to fetch the data,
	// so just rollback it later
	tx := auth.db.MustBegin()
	defer tx.Rollback()

	// Prepare statements
	stmtGetUserCount, err := tx.Preparex(`
		SELECT COUNT(id) FROM user`)
	if err != nil {
		return "", emptyUser, fmt.Errorf("failed to prepare query: %w", err)
	}

	stmtGetUser, err := tx.Preparex(`
		SELECT id, username, name, password, permission
		FROM user WHERE username = ?`)
	if err != nil {
		return "", emptyUser, fmt.Errorf("failed to prepare query: %w", err)
	}

	// Get count of user
	var nUser int
	err = stmtGetUserCount.Get(&nUser)
	if err != nil {
		return "", emptyUser, fmt.Errorf("failed to get user count: %w", err)
	}

	// Get user from database
	var user model.User
	if nUser > 0 {
		err = stmtGetUser.Get(&user, username)
		if err != nil && err != sql.ErrNoRows {
			return "", emptyUser, fmt.Errorf("failed to get user: %w", err)
		}

		if err == sql.ErrNoRows {
			return "", emptyUser, fmt.Errorf("user doesn't exist")
		}

		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
		if err != nil {
			return "", emptyUser, fmt.Errorf("username and password don't match")
		}
	}

	// Save user to session manager
	expTime := time.Duration(0)
	if user.ID == 0 {
		expTime = 15 * time.Minute
	}

	session, err := auth.sessionManager.RegisterUser(user, expTime)
	if err != nil {
		return "", emptyUser, fmt.Errorf("failed to register user: %w", err)
	}

	user.Password = ""
	return session, user, nil
}

// Logout invalidates session
func (auth *Authenticator) Logout(r *http.Request) error {
	session := auth.GetSessionFromRequest(r)
	if session == "" {
		return fmt.Errorf("session has been expired")
	}

	auth.sessionManager.RemoveUserSession(session)
	return nil
}

// MassLogout invalidates all sessions for an user.
func (auth *Authenticator) MassLogout(username string) {
	auth.sessionManager.RemoveUsername(username)
}

// AuthenticateUser checks whether the session is still valid.
// If yes, prolong its expiration time as well.
func (auth *Authenticator) AuthenticateUser(r *http.Request) error {
	// Get session from request
	session := auth.GetSessionFromRequest(r)
	if session == "" {
		return fmt.Errorf("session has been expired")
	}

	// Get data from session manager
	user, expTime, found := auth.sessionManager.GetUser(session)
	if !found {
		return fmt.Errorf("session has been expired")
	}

	// Check whether this user has permission to access the URL
	if auth.rules != nil {
		if allowed := auth.rules(user, r.Method, r.URL.Path); !allowed {
			return fmt.Errorf("user doesn't have permission to access")
		}
	}

	// If session almost expired, prolong it
	if expTime.Sub(time.Now()).Hours() < 1 {
		auth.sessionManager.ProlongUserSession(session, 0)
	}

	return nil
}

// MustAuthenticateUser is like AuthenticateUser, except it's panic when
// request doesn't have a valid session.
func (auth *Authenticator) MustAuthenticateUser(r *http.Request) {
	if err := auth.AuthenticateUser(r); err != nil {
		panic(err)
	}
}

// GetSessionFromRequest as its name implies, will get the
// session ID from http request.
func (auth *Authenticator) GetSessionFromRequest(r *http.Request) string {
	// Get session from header and cookie
	headerSession := r.Header.Get("X-Session-Server")
	cookieSession := func() string {
		cookie, err := r.Cookie("session-server")
		if err != nil {
			return ""
		}
		return cookie.Value
	}()

	// Session in cookie is more important than in header
	session := headerSession
	if cookieSession != "" {
		session = cookieSession
	}

	return session
}
