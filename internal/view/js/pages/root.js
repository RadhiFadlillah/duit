import {
	Button,
	LoadingCover,
} from "../components/_components.min.js";

import {
	DialogError,
	DialogConfirm,
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

import Cookies from '../libs/js-cookie.min.js'

export function Root() {
	let state = {
		user: null,
		loading: false,

		dlgLogout: { visible: false, loading: false },
		dlgPassword: { visible: false, loading: false },
		dlgError: { visible: false, message: "" },
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
				localStorage.removeItem("user")
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
			state.dlgError.message = "password baru tidak cocok"
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
				localStorage.removeItem("user")
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
				title: "Logout",
				message: "Yakin ingin keluar dari aplikasi ?",
				acceptText: "Ya",
				rejectText: "Tidak",
				loading: state.dlgLogout.loading,
				onAccepted() { logout() },
				onRejected() { state.dlgLogout.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgPassword.visible) {
			dialogs.push(m(DialogFormPassword, {
				title: "Ganti Password",
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
				caption: "Home",
				href: "#!"
			})),
			m(Button, sidebarAttrs("chart", {
				icon: "fa-chart-line",
				caption: "Grafik keuangan",
				href: "#!/chart"
			})),
			m(Button, sidebarAttrs("users", {
				icon: "fa-user-cog",
				caption: "Kelola user",
				href: "#!/users"
			})),
			m(".sidebar__spacer"),
			m(Button, sidebarAttrs(null, {
				icon: "fa-sign-out-alt",
				caption: "Logout",
				onclick() { state.dlgLogout.visible = true }
			})),
		]

		if (state.user != null) {
			sidebarButtons.splice(4, 0,
				m(Button, sidebarAttrs(null, {
					icon: "fa-key",
					caption: "Ganti password",
					onclick() { state.dlgPassword.visible = true }
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