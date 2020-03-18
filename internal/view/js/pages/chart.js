import {
	LoadingCover,
	AccountChart,
} from "../components/_components.min.js"

import {
	DialogError,
} from "../dialogs/_dialogs.min.js"

import {
	request,
} from "../libs/utils.min.js"

export function ChartPage() {
	let state = {
		loading: false,

		chart: {
			year: new Date().getFullYear(),
			accounts: [],
			series: [],
			min: undefined,
			max: undefined,
		},

		dlgError: { message: "", visible: false },
	}

	// API function
	let timeoutDuration = "5s"

	function loadChartData() {
		state.loading = true
		m.redraw()

		let url = new URL("/api/charts", document.baseURI)
		url.searchParams.set("year", state.chart.year)

		request(url.toString(), timeoutDuration)
			.then(json => {
				state.chart.accounts = json.accounts
				state.chart.series = json.series
			})
			.catch(err => {
				state.dlgError.message = err.message
				state.dlgError.visible = true
			})
			.finally(() => {
				state.loading = false
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

		if (state.loading) {
			covers.push(m(LoadingCover))
		}

		// Render final view
		return m(".chart-page",
			m(AccountChart, {
				class: "chart-page__main-chart",
				loading: state.loading,
				year: state.chart.year,
				accounts: state.chart.accounts,
				series: state.chart.series,
				onYearChanged(year) {
					state.chart.year = year
					loadChartData()
				}
			}),
			...dialogs,
			...covers,
		)
	}

	function onViewCreated(vnode) {
		loadChartData(vnode.dom)
	}

	function onViewUpdated(vnode) {
		if (state.needToRenderChart) renderChart(vnode.dom)
	}

	return {
		view: renderView,
		oncreate: onViewCreated,
		onupdate: onViewUpdated
	}
}