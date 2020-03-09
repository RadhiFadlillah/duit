export function Dialog() {
	function renderView(vnode) {
		// Parse attributes and set default value
		let title = vnode.attrs.title,
			message = vnode.attrs.message,
			customClass = vnode.attrs.class,
			contents = vnode.attrs.contents,
			buttons = vnode.attrs.buttons

		if (typeof title != "string") title = ""
		if (typeof message != "string") message = ""
		if (typeof customClass != "string") customClass = undefined
		if (!Array.isArray(buttons)) buttons = []

		// Create class name
		let dialogClass = "dialog",
			overlayClass = "dialog__overlay",
			headerClass = "dialog__header",
			footerClass = "dialog__footer",
			messageClass = "dialog__message"

		if (customClass) {
			if (!customClass.endsWidth("dialog")) {
				customClass += "-dialog"
			}

			dialogClass += ` ${customClass}`
			overlayClass += ` ${customClass}__overlay`
			headerClass += ` ${customClass}__header`
			footerClass += ` ${customClass}__footer`
			messageClass += ` ${customClass}__message`
		}

		// Create default contents
		if (message !== "" && typeof contents != "object") {
			contents = m("p.dialog__body", { class: messageClass }, message)
		}

		// Create footer if needed
		let dialogChildNodes = [
			m("p", { class: headerClass }, title),
			contents,
		]

		if (buttons.length > 0) {
			dialogChildNodes.push(
				m("div", { class: footerClass }, buttons)
			)
		}

		return m("div", { class: overlayClass },
			m("div", { class: dialogClass }, dialogChildNodes)
		);
	}

	return {
		view: renderView
	}
}