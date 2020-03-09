/* 
Sidebar is the sidebar of a page. It has several custom attributes :

- `activeIdx`, specify the index for actived sidebar button.
- `items`, array of item to put in the sidebar.

let attrs = {
	activeIdx: 0,
	items: [{
		href: "#",
		caption: "Caption1",
		icon: "fa-icon"
	}, {
		href: "#",
		caption: "Caption2",
		icon: "fa-icon"
	}]
}
*/

import { SidebarButton } from "./sidebar-button.min.js";

export function Sidebar() {
	return {
		view(vnode) {
			let activeIdx = vnode.attrs.activeIdx,
				items = vnode.attrs.items.map((item, idx) => {
					let className = (idx === activeIdx) ? "sidebar__button--active" : null;

					return m(SidebarButton, {
						class: className,
						icon: item.icon,
						caption: item.caption,
						href: item.href,
						onclick() { vnode.attrs.onItemSelected(idx) },
					})
				});

			return m(".sidebar", { class: vnode.attrs.class }, items);
		}
	}
}