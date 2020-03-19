package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/RadhiFadlillah/duit/internal/model"
	"github.com/julienschmidt/httprouter"
	"golang.org/x/crypto/bcrypt"
)

// SelectUsers is handler for GET /api/users
func (h *Handler) SelectUsers(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Fetch from database
	users := []model.User{}
	err := h.db.Select(&users,
		`SELECT id, username, name FROM user ORDER BY name`)
	checkError(err)

	// Return list of users
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &users)
	checkError(err)
}

// InsertUser is handler for POST /api/user
func (h *Handler) InsertUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Decode request
	var user model.User
	err := json.NewDecoder(r.Body).Decode(&user)
	checkError(err)

	// Validate input
	if user.Name == "" {
		panic(fmt.Errorf("name must not empty"))
	}

	if user.Username == "" {
		panic(fmt.Errorf("username must not empty"))
	}

	// Generate password
	user.Password = randomString(10)

	// Hash password with bcrypt
	password := []byte(user.Password)
	hashedPassword, err := bcrypt.GenerateFromPassword(password, 10)
	checkError(err)

	// Insert user to database
	res := h.db.MustExec(`INSERT INTO user
		(username, name, password) VALUES (?, ?, ?)`,
		user.Username, user.Name, hashedPassword)
	user.ID, _ = res.LastInsertId()

	// Return inserted user
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &user)
	checkError(err)
}

// DeleteUsers is handler for DELETE /api/users
func (h *Handler) DeleteUsers(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Decode request
	var ids []int
	err := json.NewDecoder(r.Body).Decode(&ids)
	checkError(err)

	// Start transaction
	// Make sure to rollback if panic ever happened
	tx := h.db.MustBegin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Prepare statements
	stmtGet, err := tx.Preparex(`SELECT username FROM user WHERE id = ?`)
	checkError(err)

	stmtDelete, err := tx.Preparex(`DELETE FROM user WHERE id = ?`)
	checkError(err)

	// Delete from database
	for _, id := range ids {
		var username string
		err = stmtGet.Get(&username, id)
		checkError(err)
		if err == sql.ErrNoRows {
			continue
		}

		stmtDelete.MustExec(id)
		h.auth.MassLogout(username)
	}

	// Commit transaction
	err = tx.Commit()
	checkError(err)
}

// UpdateUser is handler for PUT /api/user
func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Decode request
	var user model.User
	err := json.NewDecoder(r.Body).Decode(&user)
	checkError(err)

	// Validate input
	if user.Name == "" {
		panic(fmt.Errorf("name must not empty"))
	}

	if user.Username == "" {
		panic(fmt.Errorf("username must not empty"))
	}

	// Update user in database
	h.db.MustExec(`UPDATE user SET username = ?, name = ? WHERE id = ?`,
		user.Username, user.Name, user.ID)

	// Return updated user
	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &user)
	checkError(err)
}

// ChangeUserPassword is handler for PUT /api/user/password
func (h *Handler) ChangeUserPassword(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Decode request
	var request struct {
		UserID      int    `json:"userId"`
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	checkError(err)

	// Start transaction
	// Make sure to rollback if panic ever happened
	tx := h.db.MustBegin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Prepare statement
	stmtGet, err := tx.Preparex(`SELECT id, name, username, password
		FROM user WHERE id = ?`)
	checkError(err)

	stmtUpdate, err := tx.Preparex(`UPDATE user
		SET password = ? WHERE id = ?`)
	checkError(err)

	// Get user data from database
	var user model.User
	err = stmtGet.Get(&user, request.UserID)
	checkError(err)

	// Compare old password with database
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(request.OldPassword))
	if err != nil {
		panic(fmt.Errorf("old password for %s doesn't match", user.Username))
	}

	// Hash the new password with bcrypt
	newPassword := []byte(request.NewPassword)
	hashedPassword, err := bcrypt.GenerateFromPassword(newPassword, 10)
	checkError(err)

	// Update password in database
	stmtUpdate.MustExec(string(hashedPassword), user.ID)

	// Do mass logout for this account
	h.auth.MassLogout(user.Username)

	// Commit transaction
	err = tx.Commit()
	checkError(err)
}

// ResetUserPassword is handler for PUT /api/user/password/reset
func (h *Handler) ResetUserPassword(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Make sure session still valid
	h.auth.MustAuthenticateUser(r)

	// Decode request
	var id int
	err := json.NewDecoder(r.Body).Decode(&id)
	checkError(err)

	// Start transaction
	// Make sure to rollback if panic ever happened
	tx := h.db.MustBegin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Prepare statement
	stmtGet, err := tx.Preparex(`SELECT username FROM user WHERE id = ?`)
	checkError(err)

	stmtUpdate, err := tx.Preparex(`UPDATE user SET password = ? WHERE id = ?`)
	checkError(err)

	// Get username from database
	var username string
	err = stmtGet.Get(&username, id)
	checkError(err)

	// Generate password and hash with bcrypt
	password := []byte(randomString(10))
	hashedPassword, err := bcrypt.GenerateFromPassword(password, 10)
	checkError(err)

	// Update password in database
	stmtUpdate.MustExec(hashedPassword, id)

	// Do mass logout for this user
	h.auth.MassLogout(username)

	// Commit transaction
	err = tx.Commit()
	checkError(err)

	// Return new passwords
	result := struct {
		ID       int    `json:"id"`
		Password string `json:"password"`
	}{id, string(password)}

	w.Header().Add("Content-Encoding", "gzip")
	w.Header().Add("Content-Type", "application/json")
	err = encodeGzippedJSON(w, &result)
	checkError(err)
}
