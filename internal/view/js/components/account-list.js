import {
	Button,
	LoadingSign
} from "./_components.min.js";

import {
	Big
} from "../libs/big.min.js"

import {
	mergeObject,
} from "../libs/utils.min.js"

import {
	i18n,
	formatNumber
} from "../i18n/i18n.min.js"

export function AccountList() {
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
		let accounts = vnode.attrs.accounts,
			loading = vnode.attrs.loading,
			className = vnode.attrs.class,
			selection = vnode.attrs.selection,
			onItemClicked = vnode.attrs.onItemClicked,
			onNewClicked = vnode.attrs.onNewClicked,
			onEditClicked = vnode.attrs.onEditClicked,
			onDeleteClicked = vnode.attrs.onDeleteClicked

		if (!Array.isArray(accounts)) accounts = []
		if (typeof loading != "boolean") loading = false
		if (typeof className != "string") className = ""
		if (!Array.isArray(selection)) selection = []
		if (typeof onItemClicked != "function") onItemClicked = () => { }
		if (typeof onNewClicked != "function") onNewClicked = () => { }
		if (typeof onEditClicked != "function") onEditClicked = () => { }
		if (typeof onDeleteClicked != "function") onDeleteClicked = () => { }

		// Calculate sum of all accounts
		let sumAccount = accounts.reduce((sum, account) => {
			return sum.plus(Number(account.total))
		}, Big(0))

		// Render header
		let title = i18n("Account List")
		if (accounts.length > 0) title = `Total ${formatNumber(sumAccount)}`

		let headerContents = [m("p.account-list__header__title", title)],
			headerButtonAttrs = {
				iconOnly: true,
				class: "account-list__header__button",
			}

		if (accounts.length > 0 && !loading) headerContents.unshift(
			m("input[type=checkbox].account__check", {
				checked: selection.length === accounts.length,
				onclick() { toggleAllSelection(selection, accounts.length) }
			})
		)

		if (selection.length === 1) headerContents.push(
			m(Button, mergeObject(headerButtonAttrs, {
				icon: "fa-pen",
				caption: i18n("Edit account"),
				onclick() { onEditClicked() }
			}))
		)

		if (selection.length >= 1) headerContents.push(
			m(Button, mergeObject(headerButtonAttrs, {
				icon: "fa-trash-alt",
				caption: i18n("Delete account"),
				onclick() { onDeleteClicked() }
			}))
		)

		headerContents.push(m(Button, mergeObject(headerButtonAttrs, {
			icon: "fa-plus-circle",
			caption: i18n("New account"),
			onclick() { onNewClicked() }
		})))

		let header = m(".account-list__header", headerContents)

		// Render list content
		let contents = []

		if (loading) {
			contents.push(m(LoadingSign, { class: "account-list__loading-sign" }))
		} else if (accounts.length === 0) {
			contents.push(m("p.account-list__empty-message", i18n("No accounts registered")))
		} else contents = accounts.map((acc, idx) => {
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

			return m(".account",
				m("input[type=checkbox].account__check", checkAttrs),
				m(".account__data", { onclick() { onItemClicked(acc) } },
					m("p.account__name", acc.name),
					m("p.account__amount", formatNumber(acc.total)),
				)
			)
		})

		// Render final view
		return m(".account-list",
			{ class: className },
			[header, contents])
	}

	return {
		view: renderView
	}
}