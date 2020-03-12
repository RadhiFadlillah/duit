import {
	Button,
	Dialog
} from "../components/_components.min.js"

import {
	cloneObject
} from "../libs/utils.min.js"

export function DialogForm() {
	let formData = {}

	function renderView(vnode) {
		// Parse attributes and set default value
		let title = vnode.attrs.title,
			loading = vnode.attrs.loading,
			message = vnode.attrs.message,
			fields = vnode.attrs.fields,
			onRejected = vnode.attrs.onRejected,
			onAccepted = vnode.attrs.onAccepted

		if (typeof title != "string") title = ""
		if (typeof message != "string") message = ""
		if (typeof loading != "boolean") loading = false
		if (!Array.isArray(fields)) fields = []
		if (typeof onRejected != "function") onRejected = () => { }
		if (typeof onAccepted != "function") onAccepted = () => { }

		// Create form contents
		let requiredFields = [],
			formChildNodes = []

		if (message !== "") {
			formChildNodes.push(m("p.dialog__form__message", message))
		}

		fields.forEach(field => {
			// Parse field attributes
			let name = field.name,
				label = field.label,
				placeholder = field.placeholder,
				required = field.required,
				type = field.type,
				min = field.min,
				max = field.max,
				choices = field.choices,
				minlength = field.minlength,
				maxlength = field.maxlength,
				mindate = field.mindate,
				maxdate = field.maxdate,
				disabled = field.disabled

			if (typeof name != "string") name = ""
			if (typeof label != "string") label = ""
			if (typeof placeholder != "string") placeholder = label
			if (typeof required != "boolean") required = false
			if (typeof type != "string") type = "text"
			if (typeof min != "number") min = undefined
			if (typeof max != "number") max = undefined
			if (!Array.isArray(choices)) choices = []
			if (typeof minlength != "number") minlength = undefined
			if (typeof maxlength != "number") maxlength = undefined
			if (typeof mindate != "string") mindate = undefined
			if (typeof maxdate != "string") maxdate = undefined
			if (typeof disabled != "boolean") disabled = false

			// Make sure the type is valid
			switch (type) {
				case "text":
				case "password":
				case "int":
				case "float":
				case "date":
				case "boolean":
				case "select":
				case "textarea": break
				default: return
			}

			// Make sure name are not empty
			if (name === "") return

			// If required, save the field name
			if (required && !disabled) requiredFields.push(name)

			// Create label and input vnode
			let inputNode, inputClass

			if (label === "" || type === "boolean") {
				inputClass = "dialog__form__field--nolabel"
			} else {
				formChildNodes.push(m("p.dialog__form__label", label))
			}

			switch (type) {
				case "text":
				case "password":
					inputNode = m("input.dialog__form__input", {
						type: type,
						class: inputClass,
						value: formData[name],
						placeholder: placeholder,
						disabled: disabled,
						oninput(e) { formData[name] = e.target.value }
					})
					break
				case "int":
				case "float":
					inputNode = m("input.dialog__form__input", {
						type: "number",
						class: inputClass,
						value: formData[name],
						placeholder: placeholder,
						disabled: disabled,
						min: min,
						max: max,
						oninput(e) { formData[name] = e.target.value }
					})
					break
				case "date":
					inputNode = m("input.dialog__form__input", {
						type: "date",
						class: inputClass,
						value: formData[name],
						placeholder: placeholder,
						disabled: disabled,
						min: mindate,
						max: maxdate,
						oninput(e) { formData[name] = e.target.value }
					})
					break
				case "select":
					let optionNodes = choices.map(choice => {
						let choiceValue = "",
							choiceCaption = ""

						if (typeof choice === "string") {
							choiceValue = choice
							choiceCaption = choice
						} else if (typeof choice === "object") {
							choiceValue = choice.value || ""
							choiceCaption = choice.caption || ""
						}

						return m("option.dialog__form__select__option", {
							value: choiceValue,
							selected: choiceValue === formData[name],
						}, choiceCaption)
					})

					let optionSize = optionNodes.length
					if (optionSize >= 4) optionSize = 4
					if (optionSize <= 1) optionSize = 2

					inputNode = m("select.dialog__form__select", {
						class: inputClass,
						size: optionSize,
						oninput(e) { formData[name] = e.target.value }
					}, optionNodes)
					break
				case "textarea":
					inputNode = m("textarea.dialog__form__textarea", {
						class: inputClass,
						value: formData[name],
						placeholder: placeholder,
						disabled: disabled,
						minlength: minlength,
						maxlength: maxlength,
						oninput(e) { formData[name] = e.target.value }
					})
					break
				case "boolean":
					let checkFieldAttrs = {
						class: inputClass,
					}

					let checkInputAttrs = {
						checked: formData[name],
						onkeydown(e) {
							if (e.code !== "Enter" && e.code !== "NumpadEnter") return
							formData[name] = !e.target.checked
						},
						onclick(e) {
							formData[name] = e.target.checked
						}
					}

					inputNode = m("label.dialog__form__check", checkFieldAttrs,
						m("input[type=checkbox].dialog__form__check__input", checkInputAttrs),
						m("span.dialog__form__check__caption", label)
					)
			}

			formChildNodes.push(inputNode)
		})

		// Create buttons
		let buttons = [m(Button, {
			class: "dialog__button",
			caption: "OK",
			loading: loading,
			onclick() {
				let requiredIsEmpty = false,
					finalData = cloneObject(formData)

				for (const key in finalData) {
					let isRequired = requiredFields.indexOf(key) !== -1,
						fieldProps = fields.find(field => field.name === key),
						finalValue = finalData[key],
						fieldType = fieldProps.type

					if (fieldProps === undefined) {
						delete finalData[key]
						continue
					}

					if (isRequired && finalValue === "") {
						requiredIsEmpty = true
						break
					}

					if (fieldType === "int") {
						finalData[key] = parseInt(finalValue, 10) || 0
						continue
					}

					if (fieldType === "float") {
						finalData[key] = parseFloat(finalValue) || 0
						continue
					}

					if (fieldType === "boolean") {
						finalData[key] = Boolean(finalValue)
					}
				}

				if (!requiredIsEmpty) {
					onAccepted(finalData)
				}
			}
		})]

		if (!loading) {
			buttons.push(m(Button, {
				class: "dialog__button",
				caption: "Cancel",
				onclick() { onRejected() }
			}))
		}

		// Render view
		return m(Dialog, {
			title: title,
			contents: m(".dialog__body.dialog__form", formChildNodes),
			buttons: buttons
		})
	}

	function onInit(vnode) {
		// Parse attributes
		let fields = vnode.attrs.fields
		if (!Array.isArray(fields)) fields = []

		// Set default value
		fields.forEach(field => {
			let name = field.name,
				type = field.type,
				value = field.value || ""

			if (typeof name != "string") return
			if (name == "") return

			if (type === "boolean") {
				formData[name] = Boolean(value)
			} else {
				formData[name] = value.toString()
			}
		})
	}

	function onViewCreated(vnode) {
		// Focus to first input
		let input = vnode.dom.querySelector(".dialog__form>input")
		if (input == null) input = vnode.dom.querySelector(".dialog__form>textarea")
		if (input == null) input = vnode.dom.querySelector(".dialog__form>select")
		if (input) input.focus()
	}

	return {
		view: renderView,
		oninit: onInit,
		oncreate: onViewCreated,
	}
}