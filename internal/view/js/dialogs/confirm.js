import {
	Button,
	Dialog
} from "../components/_components.min.js"

export function DialogConfirm() {
	function renderView(vnode) {
		let title = vnode.attrs.title,
			message = vnode.attrs.message,
			acceptText = vnode.attrs.acceptText,
			rejectText = vnode.attrs.rejectText,
			loading = vnode.attrs.loading,
			onAccepted = vnode.attrs.onAccepted,
			onRejected = vnode.attrs.onRejected

		if (typeof title != "string") title = ""
		if (typeof message != "string") message = ""
		if (typeof acceptText != "string") acceptText = ""
		if (typeof rejectText != "string") rejectText = ""
		if (typeof loading != "boolean") loading = false
		if (typeof onAccepted != "function") onAccepted = () => { }
		if (typeof onRejected != "function") onRejected = () => { }

		let buttons = [m(Button, {
			class: "dialog__button",
			caption: acceptText,
			loading: loading,
			onclick() { onAccepted() }
		})]

		if (!loading) buttons.push(m(Button, {
			class: "dialog__button",
			caption: rejectText,
			onclick() { onRejected() }
		}))

		return m(Dialog, {
			title: title,
			message: message,
			buttons: buttons
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