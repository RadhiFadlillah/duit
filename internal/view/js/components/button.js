/* 
Button is the generic button. It has several custom attributes :

- `icon`, the FontAwesome icon..
- `caption`, the text for this button.
- `enabled`, specify whether this button enabled or not.
- `iconOnly`, specify whether this button only show the icon. If true, caption will be put on tooltip.

let attrs = {
	icon: "fa-icon"
	caption: "Caption",
	enabled: true|false,
	iconOnly: true|false
}
*/

import { Tooltip } from "./tooltip.min.js";

export function Button() {
	let tooltipVisible = false

	function renderView(vnode) {
		// Parse attributes and set default value
		let icon = vnode.attrs.icon,
			href = vnode.attrs.href,
			caption = vnode.attrs.caption,
			enabled = vnode.attrs.enabled,
			iconOnly = vnode.attrs.iconOnly,
			hasAlert = vnode.attrs.hasAlert,
			loading = vnode.attrs.loading,
			className = vnode.attrs.class,
			tooltipPosition = vnode.attrs.tooltipPosition

		if (typeof icon != "string") icon = ""
		if (typeof href != "string") href = ""
		if (typeof caption != "string") caption = ""
		if (typeof enabled != "boolean") enabled = true
		if (typeof iconOnly != "boolean") iconOnly = false
		if (typeof hasAlert != "boolean") hasAlert = false
		if (typeof loading != "boolean") loading = false
		if (typeof className != "string") className = ""
		if (typeof tooltipPosition != "string") tooltipPosition = "left"

		// Set class name
		if (loading) className += " button--loading"
		if (!enabled) className += " button--disabled"
		if (hasAlert) className += " button--alerted"

		// Render the view
		let childNodes = []

		if (icon !== "") {
			childNodes.push(m(`i.fas.fa-fw.${icon}`))
		}

		if (!iconOnly) {
			childNodes.push(m("span.button__text", caption))
		}

		if (iconOnly && tooltipVisible && caption !== "") {
			childNodes.push(m(Tooltip, {
				text: caption,
				position: tooltipPosition,
			}))
		}

		if (href !== "") {
			return m("a.button", {
				class: className,
				href: href,
				onmouseenter() { tooltipVisible = true },
				onmouseleave() { tooltipVisible = false },
			}, childNodes)
		}

		return m("button.button", {
			class: className,
			onclick: vnode.attrs.onclick,
			onmouseenter() { tooltipVisible = true },
			onmouseleave() { tooltipVisible = false },
		}, childNodes)
	}

	return {
		view: renderView
	}
}