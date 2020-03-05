// +build !prod

package ui

import (
	"net/http"
)

var assets = http.Dir("internal/view")

func init() {
	developmentMode = true
}
