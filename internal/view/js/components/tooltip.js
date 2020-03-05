/* 
Tooltip is a floating text that used to explain an interactive item (e.g. button).
It has several custom attributes :

- `text`, text for tooltip
- `position`, the position of tooltip relative to its parent
- `class`, custom class name.

let attrs = {
	text: "Text",
	position: "top|left|right|bottom",
	class: "class-name"
}
*/

export function Tooltip() {
	function renderView(vnode) {
		// Parse attributes and set default value
		let text = vnode.attrs.text
		if (typeof text != "string") text = ""

		return m("span.tooltip", {
			class: vnode.attrs.class
		}, text)
	}

	function onViewCreated(vnode) {
		// Parse attributes and set default value
		let position = vnode.attrs.position
		if (typeof position != "string") position = "right"

		// Set tooltip location
		let x, y, className,
			width = vnode.dom.offsetWidth,
			height = vnode.dom.offsetHeight,
			parentRect = vnode.dom.parentElement.getBoundingClientRect()

		switch (position) {
			case "top":
				x = parentRect.x + (parentRect.width - width) / 2
				y = parentRect.y - height
				className = "tooltip--top"
				break
			case "right":
				x = parentRect.x + parentRect.width
				y = parentRect.y + (parentRect.height - height) / 2
				className = "tooltip--right"
				break
			case "left":
				x = parentRect.x - width
				y = parentRect.y + (parentRect.height - height) / 2
				className = "tooltip--left"
				break
			default: // is bottom
				x = parentRect.x + (parentRect.width - width) / 2
				y = parentRect.y + parentRect.height
				className = "tooltip--bottom"
				break
		}

		vnode.dom.style.left = `${x}px`
		vnode.dom.style.top = `${y}px`
		vnode.dom.classList.add(className)
	}

	return {
		view: renderView,
		oncreate: onViewCreated
	}
}