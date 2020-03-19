import {
	DialogForm
} from "./form.min.js"

export function DialogFormUser() {
	function renderView(vnode) {
		// Parse attributes and set default value
		let title = vnode.attrs.title,
			loading = vnode.attrs.loading,
			defaultValue = vnode.attrs.defaultValue,
			onAccepted = vnode.attrs.onAccepted,
			onRejected = vnode.attrs.onRejected

		if (typeof title != "string") title = ""
		if (typeof loading != "boolean") loading = false
		if (typeof defaultValue != "object") defaultValue = {}
		if (typeof onAccepted != "function") onAccepted = () => { }
		if (typeof onRejected != "function") onRejected = () => { }

		// Create form fields
		let formFields = [{
			name: "name",
			label: "Nama",
			required: true
		}, {
			name: "username",
			label: "Username",
			required: true
		}]

		formFields.forEach((field, i) => {
			let fieldName = field.name
			formFields[i].value = defaultValue[fieldName] || ""
		})

		return m(DialogForm, {
			title: title,
			loading: loading,
			fields: formFields,
			onAccepted: onAccepted,
			onRejected: onRejected,
		})
	}

	return {
		view: renderView,
	}
}