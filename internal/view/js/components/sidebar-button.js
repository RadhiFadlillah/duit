/* 
Sidebar-button is the button that located in sidebar. It has several custom attributes :

- `icon`, the FontAwesome icon that used as image.
- `caption`, the text that will be shown in Tooltip.
- `class`, the class name.
- `onclick`, the click event handdler.

let attrs = {
	caption: "Caption",
	icon: "fa-icon"
}
*/

import { Tooltip } from "./tooltip.min.js";

export function SidebarButton() {
	let tooltipVisible = false

	function renderView(vnode) {
		// Parse attributes and set default value
		let icon = vnode.attrs.icon,
			caption = vnode.attrs.caption

		if (typeof icon != "string") icon = ""
		if (typeof caption != "string") caption = ""

		// Render the view
		let childNodes = [m(`i.fas.fa-fw.${icon}`)],
			attrs = {
				class: vnode.attrs.class,
				onclick: vnode.attrs.onclick,
				href: vnode.attrs.href,
				onmouseenter() { tooltipVisible = true },
				onmouseleave() { tooltipVisible = false },
			}

		if (tooltipVisible) {
			childNodes.push(m(Tooltip, {
				text: caption,
				position: "right",
			}))
		}

		return m("a.sidebar__button", attrs, childNodes);
	}

	return {
		view: renderView
	}
}