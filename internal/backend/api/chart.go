package api

import (
	"net/http"
	"time"

	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/julienschmidt/httprouter"
	"github.com/shopspring/decimal"
)

// GetChartsData is handler for GET /api/charts
func (h *Handler) GetChartsData(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Get URL parameter
	year := strToInt(r.URL.Query().Get("year"))
	if year == 0 {
		year = time.Now().Year()
	}

	// Start transaction
	// We only use it to fetch the data,
	// so just rollback it later
	tx := h.db.MustBegin()
	defer tx.Rollback()

	// Prepare statements
	stmtSelectAccounts, err := tx.Preparex(`SELECT id, name FROM account`)
	checkError(err)

	stmtGetChartSeries, err := tx.Preparex(`
		SELECT account_id, MONTH(CONCAT(month, "-01")) month, amount
		FROM cumulative_amount
		WHERE YEAR(CONCAT(month, "-01")) = ?`)
	checkError(err)

	stmtGetLimit, err := tx.Preparex(`
		SELECT MIN(amount) min_amount, MAX(amount) max_amount
		FROM cumulative_amount`)
	checkError(err)

	// Fetch from database
	accounts := []model.Account{}
	err = stmtSelectAccounts.Select(&accounts)
	checkError(err)

	chartSeries := []model.ChartSeries{}
	err = stmtGetChartSeries.Select(&chartSeries, year)
	checkError(err)

	chartLimit := struct {
		MinAmount decimal.Decimal `db:"min_amount"`
		MaxAmount decimal.Decimal `db:"max_amount"`
	}{}
	err = stmtGetLimit.Get(&chartLimit)
	checkError(err)

	// Calculate limit
	lenMaxAmount := len(chartLimit.MaxAmount.StringFixed(0))
	divisor := decimal.New(1, int32(lenMaxAmount-1))
	max := chartLimit.MaxAmount.Div(divisor).Ceil().Mul(divisor)
	min := chartLimit.MinAmount.Div(divisor).Ceil().Mul(divisor)

	// Return final result
	result := map[string]interface{}{
		"year":     year,
		"accounts": accounts,
		"series":   chartSeries,
		"min":      min,
		"max":      max,
	}

	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &result)
	checkError(err)
}
