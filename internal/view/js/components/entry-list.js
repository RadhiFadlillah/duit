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
	formatDate,
	formatNumber
} from "../i18n/i18n.min.js"

export function EntryList() {
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
		let account = vnode.attrs.account,
			entries = vnode.attrs.entries,
			loading = vnode.attrs.loading,
			className = vnode.attrs.class,
			selection = vnode.attrs.selection,
			currentPage = vnode.attrs.currentPage,
			maxPage = vnode.attrs.maxPage,
			onNewClicked = vnode.attrs.onNewClicked,
			onEditClicked = vnode.attrs.onEditClicked,
			onDeleteClicked = vnode.attrs.onDeleteClicked,
			onBackClicked = vnode.attrs.onBackClicked,
			onPageChanged = vnode.attrs.onPageChanged

		if (typeof account != "object") account = {}
		if (!Array.isArray(entries)) entries = []
		if (typeof loading != "boolean") loading = false
		if (typeof className != "string") className = ""
		if (!Array.isArray(selection)) selection = []
		if (typeof currentPage != "number") currentPage = 1
		if (typeof maxPage != "number") maxPage = 1
		if (typeof onNewClicked != "function") onNewClicked = () => { }
		if (typeof onEditClicked != "function") onEditClicked = () => { }
		if (typeof onDeleteClicked != "function") onDeleteClicked = () => { }
		if (typeof onBackClicked != "function") onBackClicked = () => { }
		if (typeof onPageChanged != "function") onPageChanged = () => { }

		// Render header
		let title = i18n("Entry List")
		if (account != null) {
			let name = account.name || "",
				total = account.total || "0"
			title = `${name} ${formatNumber(total)}`
		}

		let headerContents = [m("p.entry-list__header__title", title)],
			headerButtonAttrs = {
				iconOnly: true,
				class: "entry-list__header__button",
			}

		if (entries.length > 0 && !loading) headerContents.unshift(
			m("input[type=checkbox].entry__check", {
				checked: selection.length === entries.length,
				onclick() { toggleAllSelection(selection, entries.length) }
			})
		)

		if (selection.length === 1) headerContents.push(
			m(Button, mergeObject(headerButtonAttrs, {
				icon: "fa-pen",
				caption: i18n("Edit entry"),
				onclick() { onEditClicked() }
			}))
		)

		if (selection.length >= 1) headerContents.push(
			m(Button, mergeObject(headerButtonAttrs, {
				icon: "fa-trash-alt",
				caption: i18n("Delete entry"),
				onclick() { onDeleteClicked() }
			}))
		)

		headerContents.push(m(Button, mergeObject(headerButtonAttrs, {
			icon: "fa-plus-circle",
			caption: i18n("New entry"),
			onclick() { onNewClicked() }
		})))

		let header = m(".entry-list__header", headerContents)

		// Render list body
		let contents = []

		if (loading) {
			contents.push(m(LoadingSign, { class: "entry-list__loading-sign" }))
		} else if (entries.length === 0) {
			contents.push(m("p.entry-list__empty-message", i18n("No entries registered")))
		} else {
			entries.forEach((entry, idx) => {
				// If this is a new date, put it into the list
				let prevEntry = entries[idx - 1]
				if (prevEntry == null || entry.date !== prevEntry.date) {
					contents.push(m("p.entry__date", formatDate(entry.date)))
				}

				// Prepare class name, amount and description
				let className = "",
					amount = Big(entry.amount),
					description = entry.description || ""

				switch (entry.type) {
					case 1:
						className = "entry--income"
						break
					case 2:
						className = "entry--expense"
						amount = amount.times(-1)
						break
					case 3:
						let accountId = account.id || -1,
							accountIsReceiver = accountId === entry.affectedAccountId,
							tmpDescription = ""

						if (accountIsReceiver) {
							className = "entry--income"
							tmpDescription = i18n("Received from $name").replace("$name", entry.account)
						} else {
							className = "entry--expense"
							tmpDescription = i18n("Transferred to $name").replace("$name", entry.account)
							amount = amount.times(-1)
						}

						description = description || tmpDescription
				}

				// Prepare check box
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

				// Render the entry
				let descriptionClass
				if (entry.type === 3) descriptionClass = "entry--transfer"

				contents.push(m(".entry",
					m("input[type=checkbox].entry__check", checkAttrs),
					m("p.entry__description", { class: descriptionClass }, description),
					m("p.entry__amount", { class: className }, formatNumber(amount)),
				))
			})
		}

		let body = m(".entry-list__body", contents)

		// Add pagination as well
		let footer = []
		if (!loading) {
			let attrs = {
				iconOnly: true,
				tooltipPosition: "top",
				class: "entry-list__footer__button",
			}

			let paginationEnabled = {
				first: !loading && currentPage > 2,
				prev: !loading && currentPage > 1,
				next: !loading && currentPage < maxPage,
				last: !loading && currentPage < maxPage - 1,
			}

			footer.push(m(".entry-list__footer",
				m(Button, {
					class: "entry-list__footer__back-button",
					iconOnly: false,
					caption: i18n("Go back"),
					onclick() { onBackClicked() }
				}),
				m(".entry-list__footer__spacer"),
				m(Button, mergeObject(attrs, {
					icon: "fa-angle-double-left",
					caption: i18n("First page"),
					enabled: paginationEnabled.first,
					onclick() { onPageChanged(1) }
				})),
				m(Button, mergeObject(attrs, {
					icon: "fa-angle-left",
					caption: i18n("Previous page"),
					enabled: paginationEnabled.prev,
					onclick() { onPageChanged(currentPage - 1) }
				})),
				m("p.entry-list__footer__page", `${currentPage} / ${maxPage}`),
				m(Button, mergeObject(attrs, {
					icon: "fa-angle-right",
					caption: i18n("Next page"),
					enabled: paginationEnabled.next,
					onclick() { onPageChanged(currentPage + 1) }
				})),
				m(Button, mergeObject(attrs, {
					icon: "fa-angle-double-right",
					caption: i18n("Last page"),
					enabled: paginationEnabled.last,
					onclick() { onPageChanged(maxPage) }
				}))
			))
		}

		// Render final view
		return m(".entry-list",
			{ class: className },
			header, body, ...footer)
	}

	return {
		view: renderView
	}
}