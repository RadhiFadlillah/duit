import {
	Button,
	LoadingCover,
} from "../components/_components.min.js";

import {
	DialogError,
	DialogConfirm,
	DialogLanguage,
	DialogFormPassword
} from "../dialogs/_dialogs.min.js"

import {
	HomePage,
	ChartPage,
	UserPage,
} from "./_pages.min.js"

import {
	request,
	getActiveUser
} from "../libs/utils.min.js";

import {
	i18n,
	setLanguage,
} from "../i18n/i18n.min.js"

import Cookies from '../libs/js-cookie.min.js'

export function Root() {
	let state = {
		user: null,
		loading: false,

		dlgError: { visible: false, message: "" },
		dlgLogout: { visible: false, loading: false },
		dlgLanguage: { visible: false, loading: false },
		dlgPassword: { visible: false, loading: false },
	}

	// API function
	let timeoutDuration = "5s"

	function logout() {
		state.loading = true
		state.dlgLogout.loading = true
		m.redraw()

		request("/api/logout", timeoutDuration, { method: "POST" })
			.then(() => {
				Cookies.remove("session-duit")
				localStorage.removeItem("duit-user")
				window.location.href = "/login"
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true

				state.isLoading = false
				state.dlgLogout.loading = false
				state.dlgLogout.visible = false
				m.redraw()
			})
	}

	function changePassword(data) {
		// Make sure new password is correct
		if (data.newPassword !== data.repeatPassword) {
			state.dlgPassword.visible = false
			state.dlgError.message = i18n("new password doesn't match")
			state.dlgError.visible = true
			return
		}

		// Send API request
		state.loading = true
		state.dlgPassword.loading = true
		m.redraw()

		let options = {
			method: "PUT",
			body: JSON.stringify({
				userId: state.user.id,
				oldPassword: data.oldPassword,
				newPassword: data.newPassword
			})
		}

		request("/api/user/password", timeoutDuration, options)
			.then(() => {
				Cookies.remove("session-duit")
				localStorage.removeItem("duit-user")
				window.location.href = "/login"
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true

				state.isLoading = false
				state.dlgPassword.loading = false
				state.dlgPassword.visible = false
				m.redraw()
			})
	}

	// Local methods
	function getPageComponent(page) {
		switch (page) {
			case "home": return HomePage
			case "chart": return ChartPage
			case "users": return UserPage
			default: return HomePage
		}
	}

	// Render view
	function renderView(vnode) {
		// Parse attributes
		let activePage = vnode.attrs.page
		if (typeof activePage != "string" || activePage === "") {
			activePage = "home"
		}

		// Prepare dialogs
		let dialogs = []

		if (dialogs.length === 0 && state.dlgError.visible) {
			dialogs.push(m(DialogError, {
				message: state.dlgError.message,
				onAccepted() { state.dlgError.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgLogout.visible) {
			dialogs.push(m(DialogConfirm, {
				title: i18n("Logout"),
				message: i18n("Log out from the application ?"),
				acceptText: i18n("Yes"),
				rejectText: i18n("No"),
				loading: state.dlgLogout.loading,
				onAccepted() { logout() },
				onRejected() { state.dlgLogout.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgLanguage.visible) {
			dialogs.push(m(DialogLanguage, {
				title: i18n("Change Language"),
				loading: state.dlgLanguage.loading,
				onRejected() { state.dlgLanguage.visible = false },
				onAccepted(data) {
					setLanguage(data.language)
					location.reload(false)
				},
			}))
		}

		if (dialogs.length === 0 && state.dlgPassword.visible) {
			dialogs.push(m(DialogFormPassword, {
				title: i18n("Change Password"),
				loading: state.dlgPassword.loading,
				onAccepted(data) { changePassword(data) },
				onRejected() { state.dlgPassword.visible = false },
			}))
		}

		// Prepare loading cover
		let covers = []

		if (state.loading) {
			covers.push(m(LoadingCover))
		}

		// Prepare sidebar
		let sidebarAttrs = function (name, opts) {
			let icon = opts.icon,
				href = opts.href,
				caption = opts.caption,
				onclick = opts.onclick,
				className = "sidebar__button"

			if (typeof icon != "string") icon = ""
			if (typeof href != "string") href = ""
			if (typeof caption != "string") caption = ""
			if (typeof onclick != "function") onclick = () => { }
			if (name === activePage) className += " sidebar__button--active"

			return {
				iconOnly: true,
				tooltipPosition: "right",
				class: className,
				icon: icon,
				href: href,
				caption: caption,
				onclick: onclick,
			}
		}

		let sidebarButtons = [
			m(Button, sidebarAttrs("home", {
				icon: "fa-home",
				caption: i18n("Home"),
				href: "#!"
			})),
			m(Button, sidebarAttrs("chart", {
				icon: "fa-chart-line",
				caption: i18n("Money chart"),
				href: "#!/chart"
			})),
			m(".sidebar__spacer"),
			m(Button, sidebarAttrs(null, {
				icon: "fa-flag",
				caption: i18n("Change language"),
				onclick() { state.dlgLanguage.visible = true }
			})),
			m(Button, sidebarAttrs(null, {
				icon: "fa-key",
				caption: i18n("Change password"),
				onclick() { state.dlgPassword.visible = true }
			})),
			m(Button, sidebarAttrs(null, {
				icon: "fa-sign-out-alt",
				caption: i18n("Logout"),
				onclick() { state.dlgLogout.visible = true }
			})),
		]

		if (state.user != null && state.user.admin) {
			sidebarButtons.splice(2, 0,
				m(Button, sidebarAttrs("users", {
					icon: "fa-user-cog",
					caption: i18n("User management"),
					href: "#!/users"
				}))
			)
		}

		return m(".root",
			m(".sidebar", sidebarButtons),
			m(getPageComponent(activePage), { class: "root__content" }),
			...dialogs,
			...covers,
		)
	}

	function onInit() {
		state.user = getActiveUser()
	}

	return {
		view: renderView,
		oninit: onInit,
	}
}