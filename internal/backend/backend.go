package backend

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/RadhiFadlillah/duit/internal/backend/api"
	"github.com/RadhiFadlillah/duit/internal/backend/auth"
	"github.com/RadhiFadlillah/duit/internal/backend/ui"
	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/jmoiron/sqlx"
	"github.com/julienschmidt/httprouter"
	"github.com/sirupsen/logrus"
)

// SlowDown is middleware to throttle response speed.
// Used to emulate low connection speed.
type SlowDown struct {
	router http.Handler
}

func (sd SlowDown) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/api") {
		time.Sleep(500 * time.Millisecond)
	}

	sd.router.ServeHTTP(w, r)
}

// ServeApp serves web app in specified port
func ServeApp(db *sqlx.DB, port int) error {
	// Prepare authenticator and handler
	auth, err := auth.NewAuthenticator(db, authenticationRules)
	if err != nil {
		return fmt.Errorf("failed to create authenticator: %w", err)
	}

	uiHdl, err := ui.NewHandler(auth)
	if err != nil {
		return fmt.Errorf("failed to create UI handler: %w", err)
	}

	apiHdl, err := api.NewHandler(db, auth)
	if err != nil {
		return fmt.Errorf("failed to create API handler: %w", err)
	}

	// Create router
	router := httprouter.New()

	router.GET("/", uiHdl.ServeIndex)
	router.GET("/login", uiHdl.ServeLogin)
	router.GET("/js/*filepath", uiHdl.ServeJsFile)
	router.GET("/res/*filepath", uiHdl.ServeFile)
	router.GET("/css/*filepath", uiHdl.ServeFile)

	router.POST("/api/login", apiHdl.Login)
	router.POST("/api/logout", apiHdl.Logout)

	// Route for panic
	router.PanicHandler = func(w http.ResponseWriter, r *http.Request, arg interface{}) {
		http.Error(w, fmt.Sprint(arg), 500)
	}

	// Create server
	url := fmt.Sprintf(":%d", port)
	svr := &http.Server{
		Addr:         url,
		Handler:      SlowDown{router},
		ReadTimeout:  10 * time.Second,
		WriteTimeout: time.Minute,
	}

	// Serve app
	logrus.Infoln("Serve app in", url)
	return svr.ListenAndServe()
}

func authenticationRules(account model.Account, method, url string) bool {
	// If account doesn't have any ID, it means this is the first login when
	// there are no accounts in database. Only allow him in index, login page
	// and account management.
	if account.ID == 0 {
		switch url {
		case "/",
			"/login",
			"/api/accounts":
			return true
		default:
			return false
		}
	}

	return true
}
