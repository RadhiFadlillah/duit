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

		// Create function to set tooltip location
		function setTooltipPosition(tooltip) {
			let x, y, className,
				width = tooltip.offsetWidth,
				height = tooltip.offsetHeight,
				parentRect = tooltip.parentElement.getBoundingClientRect()

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

			tooltip.style.left = `${x}px`
			tooltip.style.top = `${y}px`
			tooltip.classList.add(className)
		}

		// Add event listener to tooltip parent
		let tooltip = vnode.dom,
			parent = tooltip.parentElement

		parent.addEventListener("mouseenter", () => {
			tooltip.classList.add("tooltip--visible")
			setTooltipPosition(tooltip)
		})

		parent.addEventListener("mouseleave", () => {
			tooltip.classList.remove("tooltip--visible")
		})
	}

	return {
		view: renderView,
		oncreate: onViewCreated
	}
}