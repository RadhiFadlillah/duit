import {
	Button,
	LoadingCover,
} from "./components/_components.min.js"

import {
	request
} from "./libs/utils.min.js"

import {
	i18n
} from "./i18n/i18n.min.js"

import Cookies from './libs/js-cookie.min.js'

function registerScreen() {
	let state = {
		loading: false,
		name: "",
		username: "",
		password: "",
		repeatPassword: "",
		error: ""
	}

	// API function
	let timeoutDuration = "5s"

	function register() {
		// Send API request
		state.loading = true
		state.error = ""
		m.redraw()

		let options = {
			method: "POST",
			body: JSON.stringify({
				name: state.name,
				username: state.username,
				password: state.password,
				admin: true,
			})
		}

		request("/api/user", timeoutDuration, options)
			.then(newUser => {
				return request("/api/login", timeoutDuration, {
					method: "POST",
					body: JSON.stringify({
						username: newUser.username,
						password: newUser.password
					})
				})
			})
			.then(json => {
				let session = json.session,
					user = json.user || null

				Cookies.set("session-duit", session, { expires: 365 })
				localStorage.setItem("duit-user", JSON.stringify(user))
				window.location.href = "/"
			})
			.catch(err => {
				state.error = err.message
			})
			.finally(() => {
				state.loading = false
				m.redraw()
			})
	}

	function renderView() {
		let errorNodes = []
		if (state.error !== "") {
			errorNodes.push(m("p.register__error", state.error))
		}

		let loadingCover = []
		if (state.loading) {
			loadingCover.push(m(LoadingCover))
		}

		let attributionNodes = i18n("Original logo by $author from $website").split(" ").map(str => {
			if (str === "$author") {
				return m("a.attribution__link", {
					target: "_blank",
					rel: "noopener",
					href: "https://www.flaticon.com/authors/freepik"
				}, "Freepik ")
			}

			if (str === "$website") {
				return m("a.attribution__link", {
					target: "_blank",
					rel: "noopener",
					href: "https://www.flaticon.com"
				}, "www.flaticon.com ")
			}

			return str + " "
		})

		return m(".register",
			m(".register__body",
				...errorNodes,
				m(".register__form",
					m("img.register__logo", {
						src: "/res/logo.svg"
					}),
					m("p.register__title", i18n("Welcome, new user")),
					m("input[type=text].register__input", {
						value: state.name,
						autocomplete: "new-password",
						placeholder: i18n("Name"),
						oninput(e) { state.name = e.target.value }
					}),
					m("input[type=text].register__input", {
						value: state.username,
						autocomplete: "new-password",
						placeholder: i18n("Username"),
						oninput(e) { state.username = e.target.value }
					}),
					m("input[type=password].register__input", {
						value: state.password,
						autocomplete: "new-password",
						placeholder: i18n("Password"),
						oninput(e) { state.password = e.target.value }
					}),
					m("input[type=password].register__input", {
						value: state.repeatPassword,
						autocomplete: "new-password",
						placeholder: i18n("Repeat password"),
						oninput(e) { state.repeatPassword = e.target.value }
					}),
					m(Button, {
						class: "register__button",
						caption: i18n("Register"),
						loading: state.loading,
						onclick() {
							// Make sure fields not empty
							if (state.name === "" || state.username === "" || state.password === "") {
								return
							}

							// Make sure repeated password is correct
							if (state.password !== state.repeatPassword) {
								state.error = i18n("new password doesn't match")
								return
							}

							register()
						}
					})
				),
			),
			m("p.attribution", attributionNodes),
			...loadingCover
		)
	}

	function onViewCreated(vnode) {
		vnode.dom.querySelector(".register__input").focus()
	}

	return {
		view: renderView,
		oncreate: onViewCreated,
	}
}

export function startApp() {
	m.mount(document.body, registerScreen)
}