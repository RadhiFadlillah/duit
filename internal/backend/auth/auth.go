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
// an account allowed to access an URL.
type AuthenticationRules func(account model.Account, method, url string) bool

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
	// accountCache used to map an account into sessions. An account can have several active sessions.
	// sessionCache used to map a session into an account. One session only match to one account.
	auth := new(Authenticator)
	auth.db = db
	auth.sessionManager = NewSessionManager(3*time.Hour, 10*time.Minute)
	auth.rules = rules

	return auth, nil
}

// Login verify that username and password match,
// generate session ID then save it to cache.
func (auth *Authenticator) Login(username, password string) (string, model.Account, error) {
	emptyAccount := model.Account{}

	// Start transaction
	// We only use it to fetch the data,
	// so just rollback it later
	tx := auth.db.MustBegin()
	defer tx.Rollback()

	// Prepare statements
	stmtGetAccountCount, err := tx.Preparex(`
		SELECT COUNT(id) FROM account`)
	if err != nil {
		return "", emptyAccount, fmt.Errorf("failed to prepare query: %w", err)
	}

	stmtGetAccount, err := tx.Preparex(`
		SELECT id, username, name, password, permission
		FROM account WHERE username = ?`)
	if err != nil {
		return "", emptyAccount, fmt.Errorf("failed to prepare query: %w", err)
	}

	// Get count of account
	var nAccount int
	err = stmtGetAccountCount.Get(&nAccount)
	if err != nil {
		return "", emptyAccount, fmt.Errorf("failed to get account count: %w", err)
	}

	// Get account from database
	var account model.Account
	if nAccount > 0 {
		err = stmtGetAccount.Get(&account, username)
		if err != nil && err != sql.ErrNoRows {
			return "", emptyAccount, fmt.Errorf("failed to get account: %w", err)
		}

		if account.ID == 0 {
			return "", emptyAccount, fmt.Errorf("account doesn't exist")
		}

		err = bcrypt.CompareHashAndPassword([]byte(account.Password), []byte(password))
		if err != nil {
			return "", emptyAccount, fmt.Errorf("username and password don't match")
		}
	}

	// Save account to session manager
	expTime := time.Duration(0)
	if account.ID == 0 {
		expTime = 15 * time.Minute
	}

	session, err := auth.sessionManager.RegisterAccount(account, expTime)
	if err != nil {
		return "", emptyAccount, fmt.Errorf("failed to register account: %w", err)
	}

	account.Password = ""
	return session, account, nil
}

// Logout invalidates session
func (auth *Authenticator) Logout(r *http.Request) error {
	session := auth.GetSessionFromRequest(r)
	if session == "" {
		return fmt.Errorf("session has been expired")
	}

	auth.sessionManager.RemoveAccountSession(session)
	return nil
}

// MassLogout invalidates all sessions for an account.
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
	account, expTime, found := auth.sessionManager.GetAccount(session)
	if !found {
		return fmt.Errorf("session has been expired")
	}

	// Check whether this account has permission to access the URL
	if auth.rules != nil {
		if allowed := auth.rules(account, r.Method, r.URL.Path); !allowed {
			return fmt.Errorf("account doesn't have permission to access")
		}
	}

	// If session almost expired, prolong it
	if expTime.Sub(time.Now()).Hours() < 1 {
		auth.sessionManager.ProlongAccountSession(session, 0)
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
