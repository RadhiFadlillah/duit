import {
	Button,
	LoadingSign
} from "./_components.min.js";

import {
	mergeObject,
} from "../libs/utils.min.js"

import {
	i18n
} from "../i18n/i18n.min.js"

export function UserList() {
	let lastSelectedRow = 0

	function toggleAllSelection(selection, nContents) {
		if (selection.length === nContents) {
			selection.splice(0, selection.length)
		} else {
			for (var row = 0; row < nContents; row++) {
				if (selection.indexOf(row) === -1) {
					selection.push(row)
				}
			}
		}
	}

	function toggleSelection(selection, row) {
		let idx = selection.indexOf(row)

		if (idx !== -1) selection.splice(idx, 1)
		else selection.push(row)

		lastSelectedRow = row
	}

	function selectRange(selection, row) {
		let start = lastSelectedRow,
			end = row

		if (start > end) {
			start = row
			end = lastSelectedRow
		}

		for (var i = start; i <= end; i++) {
			if (selection.indexOf(i) === -1) {
				selection.push(i)
			}
		}

		lastSelectedRow = row
	}

	function renderView(vnode) {
		// Parse attributes and set default value
		let users = vnode.attrs.users,
			loading = vnode.attrs.loading,
			className = vnode.attrs.class,
			selection = vnode.attrs.selection,
			onNewClicked = vnode.attrs.onNewClicked,
			onEditClicked = vnode.attrs.onEditClicked,
			onResetClicked = vnode.attrs.onResetClicked,
			onDeleteClicked = vnode.attrs.onDeleteClicked

		if (!Array.isArray(users)) users = []
		if (typeof loading != "boolean") loading = false
		if (typeof className != "string") className = ""
		if (!Array.isArray(selection)) selection = []
		if (typeof onNewClicked != "function") onNewClicked = () => { }
		if (typeof onEditClicked != "function") onEditClicked = () => { }
		if (typeof onResetClicked != "function") onResetClicked = () => { }
		if (typeof onDeleteClicked != "function") onDeleteClicked = () => { }

		// Render header
		let title = i18n("User List"),
			headerContents = [m("p.user-list__header__title", title)],
			headerButtonAttrs = {
				iconOnly: true,
				class: "user-list__header__button",
			}

		if (users.length > 0 && !loading) headerContents.unshift(
			m("input[type=checkbox].user__check", {
				checked: selection.length === users.length,
				onclick() { toggleAllSelection(selection, users.length) }
			})
		)

		if (selection.length === 1) headerContents.push(
			m(Button, mergeObject(headerButtonAttrs, {
				icon: "fa-pen",
				caption: i18n("Edit user"),
				onclick() { onEditClicked() }
			}))
		)

		if (selection.length === 1) headerContents.push(
			m(Button, mergeObject(headerButtonAttrs, {
				icon: "fa-key",
				caption: i18n("Reset user's password"),
				onclick() { onResetClicked() }
			}))
		)

		if (selection.length >= 1) headerContents.push(
			m(Button, mergeObject(headerButtonAttrs, {
				icon: "fa-trash-alt",
				caption: i18n("Delete user"),
				onclick() { onDeleteClicked() }
			}))
		)

		headerContents.push(m(Button, mergeObject(headerButtonAttrs, {
			icon: "fa-plus-circle",
			caption: i18n("New user"),
			onclick() { onNewClicked() }
		})))

		let header = m(".user-list__header", headerContents)

		// Render list content
		let contents = []

		if (loading) {
			contents.push(m(LoadingSign, { class: "user-list__loading-sign" }))
		} else if (users.length === 0) {
			contents.push(m("p.user-list__empty-message", i18n("No users registered")))
		} else contents = users.map((user, idx) => {
			let checkAttrs = {
				checked: selection.indexOf(idx) !== -1,
				onclick(e) {
					if (e.shiftKey) selectRange(selection, idx)
					else toggleSelection(selection, idx)
				},
				onkeydown(e) {
					if (e.code !== "Enter" && e.code !== "NumpadEnter") return
					if (e.shiftKey) selectRange(selection, idx)
					else toggleSelection(selection, idx)
				}
			}

			return m(".user",
				m("input[type=checkbox].user__check", checkAttrs),
				m(".user__data",
					m("p.user__name", user.name),
					m("p.user__username", user.username),
				)
			)
		})

		// Render final view
		return m(".user-list",
			{ class: className },
			[header, contents])
	}

	return {
		view: renderView
	}
}