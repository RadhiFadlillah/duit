import {
	DialogForm
} from "./form.min.js"

import {
	i18n
} from "../i18n/i18n.min.js"

export function DialogFormPassword() {
	function renderView(vnode) {
		// Parse attributes and set default value
		let title = vnode.attrs.title,
			loading = vnode.attrs.loading,
			onAccepted = vnode.attrs.onAccepted,
			onRejected = vnode.attrs.onRejected

		if (typeof title != "string") title = ""
		if (typeof loading != "boolean") loading = false
		if (typeof onAccepted != "function") onAccepted = () => { }
		if (typeof onRejected != "function") onRejected = () => { }

		// Create form fields
		let formFields = [{
			name: "oldPassword",
			label: i18n("Old password"),
			type: "password",
			required: true
		}, {
			name: "newPassword",
			label: i18n("New password"),
			type: "password",
			required: true
		}, {
			name: "repeatPassword",
			label: i18n("Repeat"),
			type: "password",
			required: true
		}]

		return m(DialogForm, {
			title: title,
			loading: loading,
			fields: formFields,
			onRejected: onRejected,
			onAccepted: onAccepted,
		})
	}

	return {
		view: renderView,
	}
}