import {
	Button,
	LoadingCover,
} from "../components/_components.min.js"

import {
	DialogError,
	DialogConfirm,
	DialogFormAccount,
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
		loading: false,
		accountsLoading: false,
		entriesLoading: false,

		accounts: [],
		activeAccount: {
			id: 0,
			name: "",
			total: "0",
			initialAmount: "0",
			entries: []
		},
		pagination: {
			page: 1,
			maxPage: 1,
		},

		dlgError: { message: "", visible: false },
		dlgNewAccount: { visible: false, loading: false },
		dlgEditAccount: { visible: false, loading: false },
		dlgDeleteAccount: { visible: false, loading: false },
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
		state.loading = true
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
				state.loading = false
				state.accountsLoading = false
				m.redraw()
			})
	}

	function loadEntries() {
		state.loading = true
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
				state.loading = false
				state.entriesLoading = false
				m.redraw()
			})
	}

	function saveNewAccount(data) {
		state.loading = true
		state.dlgNewAccount.loading = true
		m.redraw()

		let options = {
			method: "POST",
			body: JSON.stringify(data)
		}

		request("/api/account", timeoutDuration, options)
			.then(account => {
				state.accounts.push(account)
				state.accounts.sort((a, b) => {
					let nameA = a.name.toLowerCase(),
						nameB = b.name.toLowerCase()

					if (nameA < nameB) return -1
					if (nameA > nameB) return 1
					return 0
				})
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.dlgNewAccount.loading = false
				state.dlgNewAccount.visible = false
				m.redraw()
			})
	}

	function updateAccount(data) {
		state.loading = true
		state.dlgEditAccount.loading = true
		m.redraw()

		let options = {
			method: "PUT",
			body: JSON.stringify({
				id: state.activeAccount.id,
				name: data.name,
				initialAmount: data.initialAmount
			})
		}

		request("/api/account", timeoutDuration, options)
			.then(json => {
				let idx = state.accounts.findIndex(account => account.id === json.id),
					newAccount = json

				// Replace data
				state.accounts.splice(idx, 1, newAccount)
				state.activeAccount.name = newAccount.name
				state.activeAccount.total = newAccount.total
				state.activeAccount.initialAmount = newAccount.initialAmount
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.dlgEditAccount.loading = false
				state.dlgEditAccount.visible = false
				m.redraw()
			})
	}

	function deleteAccount() {
		state.loading = true
		state.dlgDeleteAccount.loading = true
		m.redraw()

		let url = `/api/account/${state.activeAccount.id}`,
			options = { method: "DELETE", }

		request(url, timeoutDuration, options)
			.then(() => {
				let deletedIdx = state.accounts.findIndex(account => {
					return account.id === state.activeAccount.id
				})

				state.accounts.splice(deletedIdx, 1)
				state.activeAccount.id = 0
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.dlgDeleteAccount.loading = false
				state.dlgDeleteAccount.visible = false
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

		if (dialogs.length === 0 && state.dlgNewAccount.visible) {
			dialogs.push(m(DialogFormAccount, {
				title: "Akun Baru",
				loading: state.dlgNewAccount.loading,
				onAccepted(data) { saveNewAccount(data) },
				onRejected() { state.dlgNewAccount.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgEditAccount.visible) {
			let defaultValue = {
				name: state.activeAccount.name,
				initialAmount: state.activeAccount.initialAmount,
			}

			dialogs.push(m(DialogFormAccount, {
				title: "Edit Akun",
				loading: state.dlgEditAccount.loading,
				defaultValue: defaultValue,
				onAccepted(data) { updateAccount(data) },
				onRejected() { state.dlgEditAccount.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgDeleteAccount.visible) {
			dialogs.push(m(DialogConfirm, {
				title: "Delete Akun",
				message: `Yakin ingin menghapus akun "${state.activeAccount.name}" ?`,
				acceptText: "Ya",
				rejectText: "Tidak",
				loading: state.dlgDeleteAccount.loading,
				onAccepted() { deleteAccount() },
				onRejected() { state.dlgDeleteAccount.visible = false }
			}))
		}

		// Prepare loading cover
		let covers = []

		if (state.loading) {
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
					state.activeAccount = account
					loadEntries()
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
					onclick() { state.dlgNewAccount.visible = true }
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
						onclick() { state.dlgEditAccount.visible = true }
					}),
					m(Button, {
						iconOnly: true,
						class: "home-list__header__button",
						icon: "fa-trash-alt",
						caption: "Delete akun",
						onclick() { state.dlgDeleteAccount.visible = true }
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