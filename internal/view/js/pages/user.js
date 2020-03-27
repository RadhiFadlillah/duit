import {
	LoadingCover,
	UserList,
} from "../components/_components.min.js"

import {
	DialogError,
	DialogAlert,
	DialogConfirm,
	DialogFormUser,
} from "../dialogs/_dialogs.min.js"

import {
	request,
	cloneObject,
} from "../libs/utils.min.js"

import {
	i18n
} from "../i18n/i18n.min.js"

export function UserPage() {
	let state = {
		loading: false,

		users: [],
		selectedUsers: [],
		usersLoading: false,

		dlgError: { message: "", visible: false },
		dlgNew: { visible: false, loading: false },
		dlgNewResult: { message: "", visible: false },
		dlgEdit: { visible: false, loading: false },
		dlgDelete: { visible: false, loading: false },
		dlgReset: { visible: false, loading: false },
		dlgResetResult: { message: "", visible: false },
	}

	// Local method
	function sortUsers(a, b) {
		let nameA = a.name.toLowerCase(),
			nameB = b.name.toLowerCase()

		if (nameA < nameB) return -1
		if (nameA > nameB) return 1
		return 0
	}

	// API function
	let timeoutDuration = "5s"

	function loadUsers() {
		state.loading = true
		state.usersLoading = true
		m.redraw()

		request("/api/users", timeoutDuration)
			.then(json => {
				state.users = json
				state.selectedUsers = []
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.usersLoading = false
				m.redraw()
			})
	}

	function saveNewUser(data) {
		state.loading = true
		state.dlgNew.loading = true
		m.redraw()

		let options = {
			method: "POST",
			body: JSON.stringify(data)
		}

		request("/api/user", timeoutDuration, options)
			.then(user => {
				state.selectedUsers = []
				state.users.push(user)
				state.users.sort(sortUsers)

				let message = i18n("User saved with password $password")
					.replace("$password", user.password)

				state.dlgNewResult.message = message
				state.dlgNewResult.visible = true
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.dlgNew.loading = false
				state.dlgNew.visible = false
				m.redraw()
			})
	}

	function updateUser(data) {
		state.loading = true
		state.dlgEdit.loading = true
		m.redraw()

		let idx = state.selectedUsers[0],
			user = state.users[idx],
			options = {
				method: "PUT",
				body: JSON.stringify({
					id: user.id,
					name: data.name,
					username: data.username,
					admin: data.admin,
				})
			}

		request("/api/user", timeoutDuration, options)
			.then(json => {
				state.users.splice(idx, 1, json)
				state.users.sort(sortUsers)
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.dlgEdit.loading = false
				state.dlgEdit.visible = false
				m.redraw()
			})
	}

	function deleteUsers() {
		state.loading = true
		state.dlgDelete.loading = true
		m.redraw()

		let ids = state.selectedUsers.map(idx => {
			return state.users[idx].id
		})

		let options = {
			method: "DELETE",
			body: JSON.stringify(ids)
		}

		request("/api/users", timeoutDuration, options)
			.then(() => {
				state.selectedUsers
					.sort((a, b) => b - a)
					.forEach(idx => { state.users.splice(idx, 1) })
				state.selectedUsers = []
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.dlgDelete.loading = false
				state.dlgDelete.visible = false
				m.redraw()
			})
	}

	function resetUserPassword() {
		state.isLoading = true
		state.dlgReset.loading = true
		m.redraw()

		let idx = state.selectedUsers[0],
			user = state.users[idx],
			options = {
				method: "PUT",
				body: JSON.stringify(user.id)
			}

		request("/api/user/password/reset", timeoutDuration, options)
			.then(json => {
				state.dlgResetResult.message = i18n("New password: $password").replace("$password", json.password)
				state.dlgResetResult.visible = true
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.isLoading = false
				state.dlgReset.loading = false
				state.dlgReset.visible = false
				m.redraw()
			})
	}

	// Render view
	function renderView() {
		// Prepare dialogs
		let dialogs = []

		if (dialogs.length === 0 && state.dlgError.visible) {
			dialogs.push(m(DialogError, {
				message: state.dlgError.message,
				onAccepted() { state.dlgError.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgNew.visible) {
			dialogs.push(m(DialogFormUser, {
				title: i18n("New User"),
				loading: state.dlgNew.loading,
				onAccepted(data) { saveNewUser(data) },
				onRejected() { state.dlgNew.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgNewResult.visible) {
			dialogs.push(m(DialogAlert, {
				title: i18n("New User"),
				btnText: i18n("OK"),
				message: state.dlgNewResult.message,
				onAccepted() { state.dlgNewResult.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgEdit.visible) {
			let idx = state.selectedUsers[0],
				user = state.users[idx],
				defaultValue = cloneObject(user)

			dialogs.push(m(DialogFormUser, {
				title: i18n("Edit User"),
				loading: state.dlgEdit.loading,
				defaultValue: defaultValue,
				onAccepted(data) { updateUser(data) },
				onRejected() { state.dlgEdit.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgDelete.visible) {
			let message = i18n("Permanently delete $n users ?")
				.replace("$n", state.selectedUsers.length)

			dialogs.push(m(DialogConfirm, {
				title: i18n("Delete User"),
				message: message,
				acceptText: i18n("Yes"),
				rejectText: i18n("No"),
				loading: state.dlgDelete.loading,
				onAccepted() { deleteUsers() },
				onRejected() { state.dlgDelete.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgReset.visible) {
			let idx = state.selectedUsers[0],
				user = state.users[idx],
				message = i18n("Reset password for $name ?").replace("$name", user.name)

			dialogs.push(m(DialogConfirm, {
				title: i18n("Reset Password"),
				message: message,
				acceptText: i18n("Yes"),
				rejectText: i18n("No"),
				loading: state.dlgReset.loading,
				onAccepted() { resetUserPassword() },
				onRejected() { state.dlgReset.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgResetResult.visible) {
			dialogs.push(m(DialogAlert, {
				title: i18n("Reset Password"),
				btnText: i18n("OK"),
				message: state.dlgResetResult.message,
				onAccepted() { state.dlgResetResult.visible = false }
			}))
		}

		// Prepare loading cover
		let covers = []

		if (state.loading) {
			covers.push(m(LoadingCover))
		}

		// Prepare user list
		let userList = m(UserList, {
			class: "user-page__user-list",
			loading: state.usersLoading,
			users: state.users,
			selection: state.selectedUsers,
			onNewClicked() { state.dlgNew.visible = true },
			onEditClicked() { state.dlgEdit.visible = true },
			onDeleteClicked() { state.dlgDelete.visible = true },
			onResetClicked() { state.dlgReset.visible = true },
		})

		// Render final view
		return m(".home-page",
			userList,
			...dialogs,
			...covers,
		)
	}

	function onViewCreated() {
		loadUsers()
	}

	return {
		view: renderView,
		oncreate: onViewCreated
	}
}