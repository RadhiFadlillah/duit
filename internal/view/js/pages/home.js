import {
	Button,
	LoadingCover,
	AccountList,
} from "../components/_components.min.js"

import {
	DialogError,
	DialogConfirm,
	DialogFormAccount,
	DialogFormEntry,
	DialogListAccount,
} from "../dialogs/_dialogs.min.js"

import {
	request,
	cloneObject,
	mergeObject,
} from "../libs/utils.min.js"

import {
	Big
} from "../libs/big.min.js"

export function Home() {
	let state = {
		loading: false,

		accounts: [],
		selectedAccounts: [],
		accountsLoading: false,

		entriesLoading: false,

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
		dlgNewEntry: { visible: false, loading: false },
		dlgTransferEntry: { visible: false, loading: false, entry: null },
	}

	// Local function
	function formatNumber(val) {
		return Number(val).toLocaleString("id-ID", {
			maximumFractionDigits: 0
		})
	}

	function getDateParts(str) {
		let parts = str.split("-")

		return {
			year: parseInt(parts[0], 10) || 1,
			month: parseInt(parts[1], 10) || 1,
			day: parseInt(parts[2], 10) || 1,
		}
	}

	function formatDate(str) {
		let parts = getDateParts(str),
			monthName = ""

		switch (parts.month) {
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

		return `${parts.day} ${monthName} ${parts.year}`
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
				state.activeAccount = null
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

		let idx = state.selectedAccounts[0],
			account = state.accounts[idx],
			options = {
				method: "PUT",
				body: JSON.stringify({
					id: account.id,
					name: data.name,
					initialAmount: data.initialAmount
				})
			}

		request("/api/account", timeoutDuration, options)
			.then(json => {
				state.accounts.splice(idx, 1, json)
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

	function deleteAccounts() {
		state.loading = true
		state.dlgDeleteAccount.loading = true
		m.redraw()

		let ids = state.selectedAccounts.map(idx => {
			return state.accounts[idx].id
		})

		let options = {
			method: "DELETE",
			body: JSON.stringify(ids)
		}

		request("/api/accounts", timeoutDuration, options)
			.then(() => {
				state.selectedAccounts
					.sort((a, b) => b - a)
					.forEach(idx => { state.accounts.splice(idx, 1) })
				state.selectedAccounts.splice(0, state.selectedAccounts.length)
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

	function saveNewEntry(data) {
		state.loading = true
		state.dlgNewEntry.loading = true
		state.dlgTransferEntry.loading = true
		m.redraw()

		data.accountId = state.activeAccount.id

		let options = {
			method: "POST",
			body: JSON.stringify(data)
		}

		request("/api/entry", timeoutDuration, options)
			.then(entry => {
				// Update list
				state.activeAccount.entries.unshift(entry)
				state.activeAccount.entries.sort((a, b) => {
					let dateA = getDateParts(a.entryDate),
						dateB = getDateParts(b.entryDate),
						intDateA = dateA.year * 365 + dateA.month * 30 + dateA.day,
						intDateB = dateB.year * 365 + dateB.month * 30 + dateB.day
					return intDateB - intDateA
				})

				// Update sum
				let entryAmount = Big(entry.amount)
				if (entry.entryType !== 1) entryAmount = entryAmount.times(-1)

				let idx = state.accounts.findIndex(acc => acc.id === state.activeAccount.id),
					affectedIdx = state.accounts.findIndex(acc => acc.id === entry.affectedAccountId)

				if (idx >= 0) {
					let account = state.accounts[idx],
						newTotal = Big(account.total).plus(entryAmount).toString()

					state.activeAccount.total = newTotal
					state.accounts[idx].total = newTotal
				}

				if (affectedIdx >= 0) {
					let account = state.accounts[affectedIdx],
						newTotal = Big(account.total).minus(entryAmount).toString()
					state.accounts[affectedIdx].total = newTotal
				}
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.dlgNewEntry.loading = false
				state.dlgNewEntry.visible = false
				state.dlgTransferEntry.loading = false
				state.dlgTransferEntry.visible = false
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
			let idx = state.selectedAccounts[0],
				account = state.accounts[idx],
				defaultValue = cloneObject(account)

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
				message: `Yakin ingin menghapus ${state.selectedAccounts.length} akun ?`,
				acceptText: "Ya",
				rejectText: "Tidak",
				loading: state.dlgDeleteAccount.loading,
				onAccepted() { deleteAccounts() },
				onRejected() { state.dlgDeleteAccount.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgNewEntry.visible) {
			dialogs.push(m(DialogFormEntry, {
				title: "Entry Baru",
				loading: state.dlgNewEntry.loading,
				onRejected() { state.dlgNewEntry.visible = false },
				onAccepted(data) {
					if (data.entryType === 3) {
						if (data.description.trim() === "") {
							data.description = null
						}

						state.dlgTransferEntry.entry = data
						state.dlgTransferEntry.visible = true
						state.dlgNewEntry.visible = false
					} else {
						saveNewEntry(data)
					}
				}
			}))
		}

		if (dialogs.length === 0 && state.dlgTransferEntry.visible) {
			let listAccounts = state.accounts
				.filter(acc => acc.id !== state.activeAccount.id)
				.map(account => {
					return { caption: account.name, value: String(account.id) }
				})

			dialogs.push(m(DialogListAccount, {
				title: "Entry Transfer",
				loading: state.dlgTransferEntry.loading,
				accounts: listAccounts,
				onRejected() { state.dlgTransferEntry.visible = false },
				onAccepted(data) {
					let newEntry = state.dlgTransferEntry.entry
					if (newEntry == null || typeof newEntry != "object") newEntry = {}
					newEntry.affectedAccountId = data.affectedAccountId
					saveNewEntry(newEntry)
				}
			}))
		}

		// Prepare loading cover
		let covers = []

		if (state.loading) {
			covers.push(m(LoadingCover))
		}

		// Prepare home contents
		let homeContents = [
			m(AccountList, {
				class: "home-account-list",
				loading: state.accountsLoading,
				accounts: state.accounts,
				selection: state.selectedAccounts,
				onNewClicked() { state.dlgNewAccount.visible = true },
				onEditClicked() { state.dlgEditAccount.visible = true },
				onDeleteClicked() { state.dlgDeleteAccount.visible = true },
				onItemClicked(account) {
					let activeAccount = state.activeAccount || {}
					if (account.id !== activeAccount.id) {
						state.activeAccount = account
						loadEntries()
					}
				},
			})
		]

		// Next, prepare list of entry
		let entryListTitle = "",
			entryListNodes = []

		if (state.activeAccount != null) {
			entryListTitle = `${state.activeAccount.name}, ${formatNumber(state.activeAccount.total)}`
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

		if (state.activeAccount != null) {
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
						onclick() { state.dlgNewEntry.visible = true }
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