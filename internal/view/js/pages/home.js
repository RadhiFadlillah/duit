import {
	Button,
	LoadingCover,
} from "../components/_components.min.js"

import {
	DialogError,
} from "../dialogs/_dialogs.min.js"

import {
	request,
	mergeObject,
} from "../libs/utils.min.js"

import {
	Big
} from "../libs/big.min.js"

export function Home() {
	let state = {
		accountsLoading: false,
		entriesLoading: false,

		accounts: [],
		activeAccount: {
			id: 0,
			name: "",
			total: "0",
			entries: []
		},
		pagination: {
			page: 1,
			maxPage: 1,
		},

		dlgError: { message: "", visible: false },
	}

	// Local function
	function formatNumber(val) {
		return Number(val).toLocaleString("id-ID", {
			maximumFractionDigits: 0
		})
	}

	function formatDate(str) {
		let parts = str.split("-"),
			year = parseInt(parts[0], 10) || 1,
			month = parseInt(parts[1], 10) || 1,
			day = parseInt(parts[2], 10) || 1,
			monthName = ""

		switch (month) {
			case 1: monthName = "Januari"; break
			case 2: monthName = "Februari"; break
			case 3: monthName = "Maret"; break
			case 4: monthName = "April"; break
			case 5: monthName = "Mei"; break
			case 6: monthName = "Juni"; break
			case 7: monthName = "Juli"; break
			case 8: monthName = "Agustus"; break
			case 9: monthName = "September"; break
			case 10: monthName = "Oktober"; break
			case 11: monthName = "November"; break
			case 12: monthName = "Desember"; break
		}

		return `${day} ${monthName} ${year}`
	}

	// API function
	let timeoutDuration = "5s"

	function loadAccounts() {
		state.accountsLoading = true
		m.redraw()

		request("/api/accounts", timeoutDuration)
			.then(json => {
				state.accounts = json
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.accountsLoading = false
				m.redraw()
			})
	}

	function loadEntries() {
		state.entriesLoading = true
		m.redraw()

		let url = new URL(`/api/account/${state.activeAccount.id}`, document.baseURI)
		url.searchParams.set("page", state.pagination.page)

		request(url.toString(), timeoutDuration)
			.then(json => {
				state.pagination.page = json.page
				state.pagination.maxPage = json.maxPage
				state.activeAccount.entries = json.entries
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.entriesLoading = false
				m.redraw()
			})
	}

	// Render view
	function renderView(vnode) {
		// Prepare dialogs
		let dialogs = []

		if (dialogs.length === 0 && state.dlgError.visible) {
			dialogs.push(m(DialogError, {
				message: state.dlgError.message,
				onAccepted() { state.dlgError.visible = false }
			}))
		}

		// Prepare loading cover
		let covers = []

		if (state.accountsLoading || state.entriesLoading) {
			covers.push(m(LoadingCover))
		}

		// Prepare home contents
		let homeContents = []

		// First, prepare list of account
		let accountListTitle = "Daftar Akun",
			accountListNodes = []

		if (!state.accountsLoading && state.accounts.length > 0) {
			let sumAccount = state.accounts.reduce((sum, account) => {
				return sum.plus(Number(account.total))
			}, Big(0))

			accountListTitle = `Total ${formatNumber(sumAccount)}`
		}

		if (state.accountsLoading) {
			accountListNodes = [m("i.fas.fa-fw.fa-spin.fa-spinner.home-list__loading-sign")]
		} else if (state.accounts.length === 0) {
			accountListNodes = [m("p.home-list__empty-message", "Belum ada akun terdaftar")]
		} else {
			accountListNodes = state.accounts.map(account => {
				let attrs = {}
				if (account.id !== state.activeAccount.id) attrs.onclick = () => {
					state.activeAccount.id = account.id
					state.activeAccount.name = account.name
					state.activeAccount.total = account.total
					loadEntries(account.id)
				}

				return m(".account", attrs,
					m("p.account__name", account.name),
					m("p.account__amount", formatNumber(account.total)),
				)
			})
		}

		homeContents.push(m(".home-list.account-list",
			m(".home-list__header.account-list__header",
				m("p.home-list__header__title", accountListTitle),
				m(Button, {
					iconOnly: true,
					class: "home-list__header__button",
					icon: "fa-plus-circle",
					caption: "Akun baru",
				}),
			),
			...accountListNodes,
		))

		// Next, prepare list of entry
		let entryListTitle = `${state.activeAccount.name}, ${formatNumber(state.activeAccount.total)}`,
			entryListNodes = []

		if (state.entriesLoading) {
			entryListNodes = [m("i.fas.fa-fw.fa-spin.fa-spinner.home-list__loading-sign")]
		} else if (state.activeAccount.entries.length === 0) {
			entryListNodes = [m("p.home-list__empty-message", "Belum ada entry yang terdaftar")]
		} else {
			state.activeAccount.entries.forEach((entry, idx) => {
				let entryClass = "",
					entryAmount = Big(entry.amount),
					entryDescription = entry.description

				if (entry.entryType === 1) {
					entryClass = "entry--income"
				} else if (entry.entryType === 2) {
					entryClass = "entry--expense"
					entryAmount = entryAmount.times(-1)
				} else {
					let accountIsReceiver = state.activeAccount.id === entry.affectedAccountId,
						relatedAccountId = accountIsReceiver ? entry.accountId : entry.affectedAccountId,
						relatedAccount = state.accounts.find(acc => acc.id === relatedAccountId),
						relatedName = relatedAccount ? relatedAccount.name : ""

					entryClass = "entry--transfer"
					if (accountIsReceiver) {
						entryDescription = `Masuk dari ${relatedName}`
					} else {
						entryDescription = `Pindah ke ${relatedName}`
						entryAmount = entryAmount.times(-1)
					}
				}

				let previousEntry = state.activeAccount.entries[idx - 1]
				if (previousEntry == null || entry.entryDate !== previousEntry.entryDate) {
					entryListNodes.push(m(".entry__date", formatDate(entry.entryDate)))
				}

				entryListNodes.push(m(".entry",
					m("p.entry__description", entryDescription),
					m("p.entry__amount", { class: entryClass }, formatNumber(entryAmount)),
				))
			})

			entryListNodes.push(m(".entry-list__space"))
		}

		// Add pagination to entry list if needed
		if (state.pagination.maxPage > 1) {
			let paginationAttrs = {
				iconOnly: true,
				tooltipPosition: "top",
				class: "entry-list__footer__button",
			}

			let paginationEnabled = {
				first: state.pagination.page > 2,
				prev: state.pagination.page > 1,
				next: state.pagination.page < state.pagination.maxPage,
				last: state.pagination.page < state.pagination.maxPage - 1,
			}

			for (const key in paginationEnabled) {
				paginationEnabled[key] = !state.entriesLoading && paginationEnabled[key]
			}

			entryListNodes.push(m(".entry-list__footer",
				m(Button, mergeObject(paginationAttrs, {
					icon: "fa-angle-double-left",
					caption: "Halaman pertama",
					enabled: paginationEnabled.first,
					onclick() {
						state.pagination.page = 1
						loadEntries()
					}
				})),
				m(Button, mergeObject(paginationAttrs, {
					icon: "fa-angle-left",
					caption: "Halaman sebelumnya",
					enabled: paginationEnabled.prev,
					onclick() {
						state.pagination.page--
						loadEntries()
					}
				})),
				m("p.entry-list__footer__page", `${state.pagination.page} / ${state.pagination.maxPage}`),
				m(Button, mergeObject(paginationAttrs, {
					icon: "fa-angle-right",
					caption: "Halaman selanjutnya",
					enabled: paginationEnabled.next,
					onclick() {
						state.pagination.page++
						loadEntries()
					}
				})),
				m(Button, mergeObject(paginationAttrs, {
					icon: "fa-angle-double-right",
					caption: "Halaman terakhir",
					enabled: paginationEnabled.last,
					onclick() {
						state.pagination.page = state.pagination.maxPage
						loadEntries()
					}
				}))
			))
		}

		if (state.activeAccount.id !== 0) {
			homeContents.push(m(".home-list.entry-list",
				m(".home-list__header.entry-list__header",
					m("p.home-list__header__title", entryListTitle),
					m(Button, {
						iconOnly: true,
						class: "home-list__header__button",
						icon: "fa-pen",
						caption: "Edit akun",
					}),
					m(Button, {
						iconOnly: true,
						class: "home-list__header__button",
						icon: "fa-trash-alt",
						caption: "Delete akun",
					}),
					m(Button, {
						iconOnly: true,
						class: "home-list__header__button",
						icon: "fa-plus-circle",
						caption: "Tambah entry",
					}),
				),
				...entryListNodes,
			))
		}

		// Render final view
		return m(".home",
			...homeContents,
			...dialogs,
			...covers,
		)
	}

	function onViewCreated() {
		loadAccounts()
	}

	return {
		view: renderView,
		oncreate: onViewCreated
	}
}