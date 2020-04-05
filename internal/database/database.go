package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/jmoiron/sqlx"
)

// Open opens database based on specified config
func Open(config model.Config) (db *sqlx.DB, err error) {
	// Specify default value
	if config.DbHost == "" {
		config.DbHost = "127.0.0.1:3306"
	}

	if config.DbName == "" {
		config.DbName = "duit"
	}

	// Connect to database
	dataSource := fmt.Sprintf("%s:%s@tcp(%s)/%s",
		config.DbUser,
		config.DbPassword,
		config.DbHost,
		config.DbName)

	db, err = sqlx.Connect("mysql", dataSource)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}
	db.SetConnMaxLifetime(time.Minute)

	// Create transaction
	var tx *sqlx.Tx
	tx, err = db.Beginx()
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Make sure to rollback if panic ever happened
	defer func() {
		if r := recover(); r != nil {
			panicErr, _ := r.(error)
			tx.Rollback()

			db = nil
			err = panicErr
		}
	}()

	// 	Generate tables
	tx.MustExec(ddlCreateUser)
	tx.MustExec(ddlCreateAccount)
	tx.MustExec(ddlCreateCategory)
	tx.MustExec(ddlCreateEntry)

	// Generate views
	tx.MustExec(ddlCreateViewAccountTotal)
	tx.MustExec(ddlCreateViewCumulativeAmount)

	// Upgrade table
	tx.MustExec(ddlUpgradeUserAddAdmin)

	// Commit transaction
	err = tx.Commit()
	checkError(err)

	return db, err
}

func checkError(err error) {
	if err != nil && err != sql.ErrNoRows {
		panic(err)
	}
}
