import {
	Button,
	LoadingCover,
	AccountList,
	EntryList,
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

		// Prepare loading cover
		let covers = []

		if (state.loading) {
			covers.push(m(LoadingCover))
		}

		// Prepare home contents
		let homeContents = []

		homeContents.push(m(AccountList, {
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
					loadEntries(account)
				}
			},
		}))

		if (state.activeAccount != null) {
			homeContents.push(m(EntryList, {
				class: "home-entry-list",
				loading: state.entriesLoading,
				account: state.activeAccount,
				entries: state.entries,
				selection: state.selectedEntries,
				currentPage: state.pagination.page,
				maxPage: state.pagination.maxPage,
				onNewClicked() { }, // TODO
				onEditClicked() { }, // TODO
				onDeleteClicked() { }, // TODO
				onItemClicked(entry) { }, // TODO
				onPageChanged(page) {
					state.pagination.page = page
					loadEntries()
				},
			}))
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