import {
	LoadingCover,
	AccountList,
	EntryList,
} from "../components/_components.min.js"

import {
	DialogError,
	DialogConfirm,
	DialogFormAccount,
	DialogEntryType,
	DialogFormEntry,
} from "../dialogs/_dialogs.min.js"

import {
	request,
	cloneObject,
	getDateParts,
} from "../libs/utils.min.js"

import {
	Big
} from "../libs/big.min.js"

export function HomePage() {
	let state = {
		loading: false,

		accounts: [],
		selectedAccounts: [],
		accountsLoading: false,
		activeAccount: null,

		entries: [],
		selectedEntries: [],
		entriesLoading: false,
		pagination: {
			page: 1,
			maxPage: 1,
		},

		dlgError: { message: "", visible: false },
		dlgNewAccount: { visible: false, loading: false },
		dlgEditAccount: { visible: false, loading: false },
		dlgDeleteAccount: { visible: false, loading: false },

		dlgEntryType: { visible: false },
		dlgNewEntry: { visible: false, loading: false, type: 0 },
		dlgEditEntry: { visible: false, loading: false },
		dlgDeleteEntry: { visible: false, loading: false },
	}

	// Local method
	function sortAccounts(a, b) {
		let nameA = a.name.toLowerCase(),
			nameB = b.name.toLowerCase()

		if (nameA < nameB) return -1
		if (nameA > nameB) return 1
		return 0
	}

	function sortEntries(a, b) {
		let dateA = getDateParts(a.date),
			dateB = getDateParts(b.date),
			intDateA = dateA.year * 365 + dateA.month * 30 + dateA.day,
			intDateB = dateB.year * 365 + dateB.month * 30 + dateB.day

		return intDateB - intDateA
	}

	function filterActiveAccount(account) {
		if (state.activeAccount == null) return true
		return account.id !== state.activeAccount.id
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
				state.selectedAccounts = []
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
				state.selectedAccounts = []
				state.accounts.push(account)
				state.accounts.sort(sortAccounts)
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
				state.accounts.sort(sortAccounts)
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
				state.selectedAccounts = []

				if (state.activeAccount != null) {
					let idx = ids.findIndex(id => id === state.activeAccount.id)
					if (idx !== -1) state.activeAccount = null
				}
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
		if (state.activeAccount == null) return

		state.loading = true
		state.entriesLoading = true
		m.redraw()

		let url = new URL("/api/entries", document.baseURI)
		url.searchParams.set("page", state.pagination.page)
		url.searchParams.set("account", state.activeAccount.id)

		request(url.toString(), timeoutDuration)
			.then(json => {
				state.entries = json.entries
				state.selectedEntries = []
				state.pagination.page = json.page
				state.pagination.maxPage = json.maxPage
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
		if (state.activeAccount == null) return
		data.accountId = state.activeAccount.id

		state.loading = true
		state.dlgNewEntry.loading = true
		m.redraw()

		let options = {
			method: "POST",
			body: JSON.stringify(data)
		}

		request("/api/entry", timeoutDuration, options)
			.then(entry => {
				// Update list
				state.selectedEntries = []
				state.entries.unshift(entry)
				state.entries.sort(sortEntries)

				// Update sum
				let idx = state.accounts.findIndex(acc => acc.id === entry.accountId),
					affectedIdx = state.accounts.findIndex(acc => acc.id === entry.affectedAccountId),
					amount = entry.type === 1 ? Big(entry.amount) : Big(entry.amount).times(-1),
					account = state.accounts[idx]

				account.total = Big(account.total).plus(amount).toString()
				state.accounts[idx] = account
				state.activeAccount = account

				if (affectedIdx >= 0) {
					let account = state.accounts[affectedIdx]
					account.total = Big(account.total).minus(amount).toString()
					state.accounts[affectedIdx] = account
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
				m.redraw()
			})
	}

	function updateEntry(data) {
		state.loading = true
		state.dlgEditEntry.loading = true
		m.redraw()

		let idx = state.selectedEntries[0],
			oldEntry = state.entries[idx],
			options = {
				method: "PUT",
				body: JSON.stringify({
					id: oldEntry.id,
					affectedAccountId: data.affectedAccountId,
					description: data.description,
					amount: data.amount,
					date: data.date,
				})
			}

		request("/api/entry", timeoutDuration, options)
			.then(entry => {
				// Update list
				state.selectedEntries = []
				state.entries.splice(idx, 1, entry)
				state.entries.sort(sortEntries)

				// Update sum
				let accountIdx = state.accounts.findIndex(acc => acc.id === entry.accountId),
					amount = Big(entry.amount),
					oldAmount = Big(oldEntry.amount),
					account = state.accounts[accountIdx]

				if (entry.type !== 1) {
					amount = amount.times(-1)
					oldAmount = oldAmount.times(-1)
				}

				account.total = Big(account.total).minus(oldAmount).plus(amount).toString()
				state.accounts[accountIdx] = account
				state.activeAccount = account

				// Update sum for affected account
				if (entry.type !== 3) return
				let affectedIdx = state.accounts.findIndex(acc => acc.id === entry.affectedAccountId),
					oldAffectedIdx = state.accounts.findIndex(acc => acc.id === oldEntry.affectedAccountId)

				if (affectedIdx === oldAffectedIdx) {
					let account = state.accounts[affectedIdx]
					account.total = Big(account.total).plus(oldAmount).minus(amount).toString()
					state.accounts[affectedIdx] = account
				} else {
					let account = state.accounts[affectedIdx],
						oldAccount = state.accounts[oldAffectedIdx]

					account.total = Big(account.total).minus(amount)
					oldAccount.total = Big(oldAccount.total).plus(oldAmount)

					state.accounts[affectedIdx] = account
					state.accounts[oldAffectedIdx] = oldAccount
				}
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.dlgEditEntry.loading = false
				state.dlgEditEntry.visible = false
				m.redraw()
			})
	}

	function deleteEntries() {
		state.loading = true
		state.dlgDeleteEntry.loading = true
		m.redraw()

		let ids = state.selectedEntries.map(idx => {
			return state.entries[idx].id
		})

		let options = {
			method: "DELETE",
			body: JSON.stringify(ids)
		}

		request("/api/entries", timeoutDuration, options)
			.then(() => {
				let sumDeleted = {}
				state.selectedEntries
					.sort((a, b) => b - a)
					.forEach(idx => {
						let entry = state.entries[idx],
							amount = Big(entry.amount)

						if (entry.type === 3) {
							let sumAccount = sumDeleted[entry.accountId] || Big(0),
								sumAffectedAccount = sumDeleted[entry.affectedAccountId] || Big(0)

							sumAccount = sumAccount.minus(amount)
							sumDeleted[entry.accountId] = sumAccount

							sumAffectedAccount = sumAffectedAccount.plus(amount)
							sumDeleted[entry.affectedAccountId] = sumAffectedAccount
						} else {
							let sumAccount = sumDeleted[entry.accountId] || Big(0)

							if (entry.type === 1) sumAccount = sumAccount.plus(amount)
							else sumAccount = sumAccount.minus(amount)

							sumDeleted[entry.accountId] = sumAccount
						}

						state.entries.splice(idx, 1)
					})
				state.selectedEntries = []

				for (const key in sumDeleted) {
					let accountId = parseInt(key, 10) || 0,
						idx = state.accounts.findIndex(account => account.id === accountId),
						account = state.accounts[idx]

					if (account != null) {
						account.total = Big(account.total).minus(sumDeleted[accountId])
						state.accounts[idx] = account
					}
				}

				loadEntries()
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
				state.dlgDeleteEntry.loading = false
				state.dlgDeleteEntry.visible = false
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

		if (dialogs.length === 0 && state.dlgEntryType.visible) {
			dialogs.push(m(DialogEntryType, {
				title: "Jenis Entry",
				onRejected() { state.dlgEntryType.visible = false },
				onAccepted(data) {
					state.dlgNewEntry.type = data.type
					state.dlgNewEntry.visible = true
					state.dlgEntryType.visible = false
				},
			}))
		}

		if (dialogs.length === 0 && state.dlgNewEntry.visible) {
			let title = ""
			switch (state.dlgNewEntry.type) {
				case 1: title = "Pemasukan Baru"; break
				case 2: title = "Pengeluaran Baru"; break
				case 3: title = "Transfer Baru"; break
			}

			dialogs.push(m(DialogFormEntry, {
				title: title,
				loading: state.dlgNewEntry.loading,
				accounts: state.accounts.filter(filterActiveAccount),
				entryType: state.dlgNewEntry.type,
				onAccepted(data) { saveNewEntry(data) },
				onRejected() { state.dlgNewEntry.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgEditEntry.visible) {
			let idx = state.selectedEntries[0],
				entry = state.entries[idx],
				defaultValue = cloneObject(entry)

			let title = ""
			switch (entry.type) {
				case 1: title = "Edit Pemasukan"; break
				case 2: title = "Edit Pengeluaran"; break
				case 3: title = "Edit Transfer"; break
			}

			dialogs.push(m(DialogFormEntry, {
				title: title,
				loading: state.dlgEditEntry.loading,
				accounts: state.accounts.filter(filterActiveAccount),
				entryType: entry.type,
				defaultValue: defaultValue,
				onAccepted(data) { updateEntry(data) },
				onRejected() { state.dlgEditEntry.visible = false }
			}))
		}

		if (dialogs.length === 0 && state.dlgDeleteEntry.visible) {
			dialogs.push(m(DialogConfirm, {
				title: "Delete Entry",
				message: `Yakin ingin menghapus ${state.selectedEntries.length} entry ?`,
				acceptText: "Ya",
				rejectText: "Tidak",
				loading: state.dlgDeleteEntry.loading,
				onAccepted() { deleteEntries() },
				onRejected() { state.dlgDeleteEntry.visible = false }
			}))
		}

		// Prepare loading cover
		let covers = []

		if (state.loading) {
			covers.push(m(LoadingCover))
		}

		// Prepare home contents
		let homeContents = []

		homeContents.push(m(AccountList, {
			class: "home-page__account-list",
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
					state.pagination.maxPage = 1
					state.pagination.page = 1
					loadEntries(account)
				}
			},
		}))

		if (state.activeAccount != null) {
			homeContents.push(m(EntryList, {
				class: "home-page__entry-list",
				loading: state.entriesLoading,
				account: state.activeAccount,
				entries: state.entries,
				selection: state.selectedEntries,
				currentPage: state.pagination.page,
				maxPage: state.pagination.maxPage,
				onNewClicked() { state.dlgEntryType.visible = true },
				onEditClicked() { state.dlgEditEntry.visible = true },
				onDeleteClicked() { state.dlgDeleteEntry.visible = true },
				onItemClicked(entry) { }, // TODO
				onPageChanged(page) {
					state.pagination.page = page
					loadEntries()
				},
			}))
		}

		// Render final view
		return m(".home-page",
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