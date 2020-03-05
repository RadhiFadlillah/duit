package model

import (
	"encoding/json"
)

// Config is content of configuration file
type Config struct {
	DbUser     string
	DbPassword string
	DbHost     string
	DbName     string
}

// Account is container for account's data
type Account struct {
	ID         int64           `db:"id"          json:"id"`
	Username   string          `db:"username"    json:"username"`
	Name       string          `db:"name"        json:"name"`
	Password   string          `db:"password"    json:"password,omitempty"`
	Permission json.RawMessage `db:"permission"  json:"permission"`
}
