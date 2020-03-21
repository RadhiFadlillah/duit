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

function loginScreen() {
	let state = {
		loading: false,
		username: "",
		password: "",
		error: ""
	}

	function login() {
		state.loading = true
		state.error = ""
		m.redraw()

		let options = {
			method: "POST",
			body: JSON.stringify({
				username: state.username,
				password: state.password
			})
		}

		request("/api/login", "5s", options)
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
			errorNodes.push(m("p.login__error", state.error))
		}

		let loadingCover = []
		if (state.loading) {
			loadingCover.push(m(LoadingCover))
		}

		return m(".login",
			...errorNodes,
			m(".login__form",
				m("img.login__logo", {
					src: "/res/logo.svg"
				}),
				m("input[type=text].login__input", {
					value: state.username,
					placeholder: i18n("Username"),
					oninput(e) { state.username = e.target.value }
				}),
				m("input[type=password].login__input", {
					value: state.password,
					placeholder: i18n("Password"),
					oninput(e) { state.password = e.target.value }
				}),
				m(Button, {
					class: "login__button",
					caption: i18n("Login"),
					loading: state.loading,
					onclick() { login() }
				})
			),
			...loadingCover
		)
	}

	function onViewCreated(vnode) {
		vnode.dom.querySelector(".login__input").focus()
	}

	return {
		view: renderView,
		oncreate: onViewCreated,
	}
}

export function startApp() {
	m.mount(document.body, loginScreen)
}