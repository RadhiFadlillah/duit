import {
	DialogForm
} from "./form.min.js"

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
				{ value: "1", caption: "Pemasukan" },
				{ value: "2", caption: "Pengeluaran" },
				{ value: "3", caption: "Transfer" },
			]
		}]

		return m(DialogForm, {
			title: title,
			fields: formFields,
			message: "Pilih jenis entry",
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