import {
	Button,
	Dialog
} from "../components/_components.min.js"

export function DialogAlert() {
	function renderView(vnode) {
		let title = vnode.attrs.title,
			message = vnode.attrs.message,
			btnText = vnode.attrs.btnText,
			loading = vnode.attrs.loading,
			onAccepted = vnode.attrs.onAccepted

		if (typeof title != "string") title = ""
		if (typeof message != "string") message = ""
		if (typeof btnText != "string") btnText = ""
		if (typeof loading != "boolean") loading = false
		if (typeof onAccepted != "function") onAccepted = () => { }

		return m(Dialog, {
			title: title,
			message: message,
			buttons: [
				m(Button, {
					class: "dialog__button",
					caption: btnText,
					loading: loading,
					onclick() { onAccepted() }
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