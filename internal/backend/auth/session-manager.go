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

	// User session is map for user sessions and its expiration time.
	// Special mention for username sesssion list, which is list of sessions
	// that used by a username. Useful for mass logout.
	userSession         map[string]model.User
	userSessionExp      map[string]time.Time
	usernameSessionList map[string][]string

	// List of duration that used by goroutines
	defaultExpiration time.Duration
	cleanupInterval   time.Duration
}

// NewSessionManager returnns new SessionManager.
func NewSessionManager(defaultExpiration, cleanupInterval time.Duration) *SessionManager {
	sm := &SessionManager{
		userSession:         make(map[string]model.User),
		userSessionExp:      make(map[string]time.Time),
		usernameSessionList: make(map[string][]string),

		defaultExpiration: defaultExpiration,
		cleanupInterval:   cleanupInterval,
	}

	go sm.cleanUpExpiredSessions()

	return sm
}

// RegisterUser register user and return its session
func (sm *SessionManager) RegisterUser(user model.User, duration time.Duration) (string, error) {
	// Set default active duration
	if duration <= 0 {
		duration = sm.defaultExpiration
	}

	// If user is empty, make its duration short
	if user.ID == 0 {
		duration = 20 * time.Minute
	}

	// Create random session
	session, err := sm.createSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}

	// Save the new session to map
	sm.Lock()
	defer sm.Unlock()

	sm.userSession[session] = user
	sm.userSessionExp[session] = time.Now().Add(duration)
	sm.usernameSessionList[user.Username] = append(sm.usernameSessionList[user.Username], session)

	return session, nil
}

// GetUser get user based on specified session
func (sm *SessionManager) GetUser(session string) (model.User, time.Time, bool) {
	sm.RLock()
	defer sm.RUnlock()

	user, ok1 := sm.userSession[session]
	expTime, ok2 := sm.userSessionExp[session]
	return user, expTime, ok1 && ok2
}

// RemoveUserSession removes the specified session from list of active user sessions.
func (sm *SessionManager) RemoveUserSession(session string) {
	sm.Lock()
	defer sm.Unlock()

	delete(sm.userSession, session)
	delete(sm.userSessionExp, session)
}

// ProlongUserSession extends the expiration time for specified session
func (sm *SessionManager) ProlongUserSession(session string, duration time.Duration) {
	// Set default duration
	if duration <= 0 {
		duration = sm.defaultExpiration
	}

	sm.Lock()
	defer sm.Unlock()

	if expTime, ok := sm.userSessionExp[session]; ok {
		expTime = expTime.Add(duration)
		sm.userSessionExp[session] = expTime
	}
}

// RemoveUsername removes the specified username from list of active sessions. Used for mass logout.
func (sm *SessionManager) RemoveUsername(username string) {
	sm.Lock()
	defer sm.Unlock()

	if sessions, ok := sm.usernameSessionList[username]; ok {
		for _, session := range sessions {
			delete(sm.userSession, session)
			delete(sm.userSessionExp, session)
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

		for session, expTime := range sm.userSessionExp {
			if currentTime.After(expTime) {
				delete(sm.userSession, session)
				delete(sm.userSessionExp, session)
			}
		}

		sm.Unlock()
	}
}
