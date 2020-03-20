import {
	DialogForm
} from "./form.min.js"

import {
	i18n
} from "../i18n/i18n.min.js"

export function DialogFormAccount() {
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
			label: i18n("Name"),
			required: true
		}, {
			name: "initialAmount",
			label: i18n("Initial amount"),
			type: "float",
			min: 0,
		}]

		formFields.forEach((field, i) => {
			let fieldName = field.name
			formFields[i].value = defaultValue[fieldName] || ""
		})

		return m(DialogForm, {
			title: title,
			loading: loading,
			fields: formFields,
			onRejected: onRejected,
			onAccepted(data) {
				if (data.initialAmount >= 0) {
					onAccepted(data)
				}
			}
		})
	}

	return {
		view: renderView,
	}
}