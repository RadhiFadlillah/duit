import {
	DialogForm
} from "./form.min.js"

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
			label: "Password lama",
			type: "password",
			required: true
		}, {
			name: "newPassword",
			label: "Password baru",
			type: "password",
			required: true
		}, {
			name: "repeatPassword",
			type: "password",
			label: "Ulangi",
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