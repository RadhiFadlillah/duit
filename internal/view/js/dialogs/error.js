import {
	Button,
	Dialog
} from "../components/_components.min.js"

import Cookies from '../libs/js-cookie.min.js'

export function DialogError() {
	function renderView(vnode) {
		let message = vnode.attrs.message,
			loading = vnode.attrs.loading,
			onAccepted = vnode.attrs.onAccepted

		if (typeof message != "string") message = ""
		if (typeof loading != "boolean") loading = false
		if (typeof onAccepted != "function") onAccepted = () => { }

		return m(Dialog, {
			title: "Error",
			message: message,
			buttons: [
				m(Button, {
					class: "dialog__button",
					caption: "OK",
					loading: loading,
					onclick() {
						if (message.startsWith("session has been expired")) {
							Cookies.remove("session-server")
							localStorage.removeItem("account")
							window.location.href = "/login"
							return
						}

						onAccepted()
					}
				}),
			]
		})
	}

	function onViewCreated(vnode) {
		vnode.dom.querySelector(".dialog__footer>button").focus()
	}

	return {
		view: renderView,
		oncreate: onViewCreated,
	}
}