package api

import (
	"compress/gzip"
	"database/sql"
	"encoding/json"
	"io"
	"math/rand"
	"net"
	"os"
	"strconv"
	"syscall"
)

const (
	capsLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	letters     = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
)

func randomString(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}

	return string(b)
}

func encodeGzippedJSON(w io.Writer, val interface{}) error {
	gz := gzip.NewWriter(w)
	err := json.NewEncoder(gz).Encode(val)
	if err != nil {
		return err
	}

	return gz.Close()
}

func strToInt(str string) int {
	result, _ := strconv.Atoi(str)
	return result
}

func checkError(err error) {
	if err == nil || err == sql.ErrNoRows {
		return
	}

	// Check for a broken connection, as it is not really a
	// condition that warrants a panic stack trace.
	if ne, ok := err.(*net.OpError); ok {
		if se, ok := ne.Err.(*os.SyscallError); ok {
			if se.Err == syscall.EPIPE || se.Err == syscall.ECONNRESET {
				return
			}
		}
	}

	panic(err)
}
