import {
	DialogForm
} from "./form.min.js"

export function DialogListAccount() {
	function renderView(vnode) {
		// Parse attributes and set default value
		let title = vnode.attrs.title,
			loading = vnode.attrs.loading,
			accounts = vnode.attrs.accounts,
			defaultValue = vnode.attrs.defaultValue,
			onAccepted = vnode.attrs.onAccepted,
			onRejected = vnode.attrs.onRejected

		if (typeof title != "string") title = ""
		if (typeof loading != "boolean") loading = false
		if (typeof defaultValue != "object") defaultValue = {}
		if (typeof onAccepted != "function") onAccepted = () => { }
		if (typeof onRejected != "function") onRejected = () => { }
		if (!Array.isArray(accounts)) accounts = []

		// Create form fields
		let formFields = [{
			name: "affectedAccountId",
			type: "select",
			required: true,
			choices: accounts
		}]

		formFields.forEach((field, i) => {
			let fieldName = field.name
			formFields[i].value = defaultValue[fieldName] || ""
		})

		return m(DialogForm, {
			title: title,
			loading: loading,
			fields: formFields,
			message: "Pilih tujuan transfer",
			onRejected: onRejected,
			onAccepted(data) {
				data.affectedAccountId = parseInt(data.affectedAccountId, 10)
				onAccepted(data)
			}
		})
	}

	return {
		view: renderView,
	}
}