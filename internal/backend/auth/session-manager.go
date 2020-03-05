package auth

import (
	"fmt"
	"sync"
	"time"

	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/gofrs/uuid"
)

// SessionManager is struct to manage all sessions
type SessionManager struct {
	sync.RWMutex

	// Account session is map for account sessions and its expiration time.
	// Special mention for username sesssion list, which is list of sessions
	// that used by a username. Useful for mass logout.
	accountSession      map[string]model.Account
	accountSessionExp   map[string]time.Time
	usernameSessionList map[string][]string

	// List of duration that used by goroutines
	defaultExpiration time.Duration
	cleanupInterval   time.Duration
}

// NewSessionManager returnns new SessionManager.
func NewSessionManager(defaultExpiration, cleanupInterval time.Duration) *SessionManager {
	sm := &SessionManager{
		accountSession:      make(map[string]model.Account),
		accountSessionExp:   make(map[string]time.Time),
		usernameSessionList: make(map[string][]string),

		defaultExpiration: defaultExpiration,
		cleanupInterval:   cleanupInterval,
	}

	go sm.cleanUpExpiredSessions()

	return sm
}

// RegisterAccount register account and return its session
func (sm *SessionManager) RegisterAccount(account model.Account, duration time.Duration) (string, error) {
	// Set default active duration
	if duration <= 0 {
		duration = sm.defaultExpiration
	}

	// Create random session
	session, err := sm.createSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}

	// Save the new session to map
	sm.Lock()
	defer sm.Unlock()

	sm.accountSession[session] = account
	sm.accountSessionExp[session] = time.Now().Add(duration)
	sm.usernameSessionList[account.Username] = append(sm.usernameSessionList[account.Username], session)

	return session, nil
}

// GetAccount get account based on specified session
func (sm *SessionManager) GetAccount(session string) (model.Account, time.Time, bool) {
	sm.RLock()
	defer sm.RUnlock()

	account, ok1 := sm.accountSession[session]
	expTime, ok2 := sm.accountSessionExp[session]
	return account, expTime, ok1 && ok2
}

// RemoveAccountSession removes the specified session from list of active account sessions.
func (sm *SessionManager) RemoveAccountSession(session string) {
	sm.Lock()
	defer sm.Unlock()

	delete(sm.accountSession, session)
	delete(sm.accountSessionExp, session)
}

// ProlongAccountSession extends the expiration time for specified session
func (sm *SessionManager) ProlongAccountSession(session string, duration time.Duration) {
	// Set default duration
	if duration <= 0 {
		duration = sm.defaultExpiration
	}

	sm.Lock()
	defer sm.Unlock()

	if expTime, ok := sm.accountSessionExp[session]; ok {
		expTime = expTime.Add(duration)
		sm.accountSessionExp[session] = expTime
	}
}

// RemoveUsername removes the specified username from list of active sessions. Used for mass logout.
func (sm *SessionManager) RemoveUsername(username string) {
	sm.Lock()
	defer sm.Unlock()

	if sessions, ok := sm.usernameSessionList[username]; ok {
		for _, session := range sessions {
			delete(sm.accountSession, session)
			delete(sm.accountSessionExp, session)
		}

		delete(sm.usernameSessionList, username)
	}
}

func (sm *SessionManager) createSession() (string, error) {
	session, err := uuid.NewV4()
	if err != nil {
		return "", err
	}

	return session.String(), nil
}

func (sm *SessionManager) cleanUpExpiredSessions() {
	for {
		time.Sleep(sm.cleanupInterval)

		sm.Lock()
		currentTime := time.Now()

		for session, expTime := range sm.accountSessionExp {
			if currentTime.After(expTime) {
				delete(sm.accountSession, session)
				delete(sm.accountSessionExp, session)
			}
		}

		sm.Unlock()
	}
}
