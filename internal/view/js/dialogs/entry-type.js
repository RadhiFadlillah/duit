import {
	DialogForm
} from "./form.min.js"

import {
	i18n,
} from "../i18n/i18n.min.js"

export function DialogEntryType() {
	function renderView(vnode) {
		// Parse attributes and set default value
		let title = vnode.attrs.title,
			onAccepted = vnode.attrs.onAccepted,
			onRejected = vnode.attrs.onRejected

		if (typeof title != "string") title = ""
		if (typeof onAccepted != "function") onAccepted = () => { }
		if (typeof onRejected != "function") onRejected = () => { }

		// Create form fields
		let formFields = [{
			name: "type",
			type: "select",
			required: true,
			choices: [
				{ value: "1", caption: i18n("Income") },
				{ value: "2", caption: i18n("Expense") },
				{ value: "3", caption: i18n("Transfer") },
			]
		}]

		return m(DialogForm, {
			title: title,
			fields: formFields,
			onRejected: onRejected,
			onAccepted(data) {
				data.type = parseInt(data.type, 10)
				onAccepted(data)
			}
		})
	}

	return {
		view: renderView,
	}
}