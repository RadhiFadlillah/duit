import {
	DialogForm
} from "./form.min.js"

import {
	i18n
} from "../i18n/i18n.min.js"

export function DialogFormEntry() {
	function isoDateString(d) {
		let date = String(d.getDate()).padStart(2, "0"),
			month = String(d.getMonth() + 1).padStart(2, "0"),
			year = d.getFullYear()

		return `${year}-${month}-${date}`
	}

	function renderView(vnode) {
		// Parse attributes and set default value
		let title = vnode.attrs.title,
			loading = vnode.attrs.loading,
			accounts = vnode.attrs.accounts,
			entryType = vnode.attrs.entryType,
			defaultValue = vnode.attrs.defaultValue,
			onAccepted = vnode.attrs.onAccepted,
			onRejected = vnode.attrs.onRejected

		if (typeof title != "string") title = ""
		if (typeof loading != "boolean") loading = false
		if (!Array.isArray(accounts)) accounts = []
		if (typeof entryType != "number") entryType = 1
		if (typeof defaultValue != "object") defaultValue = {}
		if (typeof onAccepted != "function") onAccepted = () => { }
		if (typeof onRejected != "function") onRejected = () => { }

		// Normalize entry type
		entryType = Math.floor(entryType)
		if (entryType < 1 || entryType > 3) entryType = 1

		// Create form fields
		let formFields = [{
			name: "amount",
			label: i18n("Amount"),
			type: "float",
			min: 0,
			required: true
		}, {
			name: "date",
			label: i18n("Entry date"),
			type: "date",
			required: true
		}]

		if (entryType !== 3) formFields.unshift({
			name: "description",
			label: i18n("Description"),
			required: true
		},{
			name: "category",
			label: i18n("Category"),
			required: false
		})

		if (entryType === 3) formFields.push({
			name: "affectedAccountId",
			label: i18n("Target"),
			type: "select",
			required: true,
			choices: accounts.map(account => {
				return { caption: account.name, value: String(account.id) }
			})
		})

		// Set default value
		let defaultDate = defaultValue["date"]
		if (defaultDate == null || defaultDate === "") {
			defaultValue["date"] = isoDateString(new Date())
		}

		formFields.forEach((field, i) => {
			let fieldName = field.name
			formFields[i].value = defaultValue[fieldName] || ""
		})

		// Render final dialog
		return m(DialogForm, {
			title: title,
			loading: loading,
			fields: formFields,
			onRejected: onRejected,
			onAccepted(data) {
				data.type = entryType
				data.affectedAccountId = parseInt(data.affectedAccountId, 10)
				onAccepted(data)
			}
		})
	}

	return {
		view: renderView,
	}
}