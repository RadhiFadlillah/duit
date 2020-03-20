import {
	DialogForm
} from "./form.min.js"

import {
	i18n,
} from "../i18n/i18n.min.js"

export function DialogLanguage() {
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
			name: "language",
			type: "select",
			required: true,
			choices: [
				{ value: "en", caption: i18n("English") },
				{ value: "id", caption: i18n("Indonesia") },
			]
		}]

		return m(DialogForm, {
			title: title,
			fields: formFields,
			onRejected: onRejected,
			onAccepted: onAccepted,
		})
	}

	return {
		view: renderView,
	}
}