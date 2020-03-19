//go:generate go run assets-generator.go

package main

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/RadhiFadlillah/duit/internal/backend"
	"github.com/RadhiFadlillah/duit/internal/database"
	"github.com/RadhiFadlillah/duit/internal/model"
	_ "github.com/go-sql-driver/mysql"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

func main() {
	// Format logrus
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp:   true,
		TimestampFormat: "2006-01-02 15:04:05",
	})

	// Seed the randomizer
	rand.Seed(time.Now().UTC().UnixNano())

	// Prepare cmd
	cmd := &cobra.Command{
		Use:   "duit",
		Short: "Start duit, the simple money manager",
		RunE:  cmdHandler,
	}

	cmd.Flags().IntP("port", "p", 8080, "Port used by the server")
	cmd.Flags().StringP("config", "c", "config.toml", "Path to config file")

	// Execute
	err := cmd.Execute()
	if err != nil {
		logrus.Fatalln(err)
	}
}

func cmdHandler(cmd *cobra.Command, args []string) error {
	// Get flags value
	port, _ := cmd.Flags().GetInt("port")
	configPath, _ := cmd.Flags().GetString("config")

	// Decode config file
	var config model.Config
	_, err := toml.DecodeFile(configPath, &config)
	if err != nil {
		logrus.Fatalf("Server error: %v\n", err)
	}

	// Open database
	db, err := database.Open(config)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	// Start backend
	err = backend.ServeApp(db, port)
	if err != nil {
		return fmt.Errorf("failed to start server: %w", err)
	}

	return nil
}
