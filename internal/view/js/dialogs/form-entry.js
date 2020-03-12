import {
	DialogForm
} from "./form.min.js"

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
			name: "description",
			label: "Deskripsi",
			required: true
		}, {
			name: "amount",
			label: "Jumlah",
			type: "float",
			min: 0,
			required: true
		}, {
			name: "entryDate",
			label: "Tanggal entri",
			type: "date",
			required: true
		}, {
			name: "entryType",
			label: "Jenis entry",
			type: "select",
			required: true,
			choices: [
				{ value: "1", caption: "Pemasukan" },
				{ value: "2", caption: "Pengeluaran" },
				{ value: "3", caption: "Transfer" },
			]
		}]

		let defaultDate = defaultValue["entryDate"]
		if (defaultDate == null || defaultDate === "") {
			defaultValue["entryDate"] = isoDateString(new Date())
		}

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
				data.entryType = parseInt(data.entryType, 10)
				onAccepted(data)
			}
		})
	}

	return {
		view: renderView,
	}
}