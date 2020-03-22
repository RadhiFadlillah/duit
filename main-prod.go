// +build prod

package main

import (
	"os"
	fp "path/filepath"

	"github.com/sirupsen/logrus"
)

func init() {
	userConfigDir, err := os.UserConfigDir()
	if err != nil {
		logrus.Fatalln("Failed to get user config dir:", err)
	}

	duitConfigDir := fp.Join(userConfigDir, "duit")
	err = os.MkdirAll(duitConfigDir, os.ModePerm)
	if err != nil {
		logrus.Fatalln("Failed to create config dir:", err)
	}

	defaultConfigPath = fp.Join(duitConfigDir, "config.toml")
}
