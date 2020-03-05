package ui

import (
	"bytes"
	"fmt"
	"io"
	"mime"
	"net"
	"net/http"
	"os"
	fp "path/filepath"
	"strconv"
	"strings"
	"syscall"
)

var (
	presetMimeTypes = map[string]string{
		".css":  "text/css; charset=utf-8",
		".html": "text/html; charset=utf-8",
		".js":   "application/javascript",
		".png":  "image/png",
	}
)

type gzippedAssets interface {
	GzipBytes() []byte
}

func serveAssets(w http.ResponseWriter, filePath string, etagRequest string) error {
	// Open file
	src, err := assets.Open(filePath)
	if err != nil {
		return err
	}
	defer src.Close()

	// Get file statistic
	info, err := src.Stat()
	if err != nil {
		return err
	}

	// Compare current etag and requested etag
	etag := fmt.Sprintf(`W/"%x-%x"`, info.ModTime().Unix(), info.Size())
	if etag == etagRequest && etagRequest != "" {
		w.WriteHeader(http.StatusNotModified)
		return nil
	}

	// Get content type
	ext := fp.Ext(filePath)
	mimeType := guessTypeByExtension(ext)

	// Write response header
	w.Header().Set("ETag", etag)
	w.Header().Set("Content-Length", strconv.FormatInt(info.Size(), 10))

	if mimeType != "" {
		w.Header().Set("Content-Type", mimeType)
		w.Header().Set("X-Content-Type-Options", "nosniff")
	}

	// Serve file
	// when possible, serves the gzipped content
	if gzippedFile, ok := src.(gzippedAssets); ok {
		w.Header().Set("Content-Encoding", "gzip")
		_, err = io.Copy(w, bytes.NewReader(gzippedFile.GzipBytes()))
	} else {
		_, err = io.Copy(w, src)
	}

	return err
}

func guessTypeByExtension(ext string) string {
	ext = strings.ToLower(ext)

	if v, ok := presetMimeTypes[ext]; ok {
		return v
	}

	return mime.TypeByExtension(ext)
}

func assetExists(filePath string) bool {
	f, err := assets.Open(filePath)
	if f != nil {
		f.Close()
	}
	return err == nil || !os.IsNotExist(err)
}

func redirectPage(w http.ResponseWriter, r *http.Request, url string) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	http.Redirect(w, r, url, 301)
}

func checkError(err error) {
	if err == nil {
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
