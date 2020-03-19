import {
	Sidebar,
} from "../components/_components.min.js";

import {
	HomePage,
	ChartPage,
	UserPage,
} from "./_pages.min.js"

export function Root() {
	let sidebarActiveIdx = -1,
		sidebarItems = [{
			href: "#!/home",
			caption: "Home",
			icon: "fa-home"
		}, {
			href: "#!/chart",
			caption: "Grafik keuangan",
			icon: "fa-chart-bar"
		}, {
			href: "#!/users",
			caption: "Kelola user",
			icon: "fa-user-cog"
		}]

	function parseSubPage(subPage) {
		let component = HomePage,
			sidebarIndex = 0

		switch (subPage) {
			case "home":
				component = HomePage
				sidebarIndex = 0
				break
			case "chart":
				component = ChartPage
				sidebarIndex = 1
				break
			case "users":
				component = UserPage
				sidebarIndex = 2
				break
		}

		return {
			component: component,
			sidebarIndex: sidebarIndex,
		}
	}

	function renderView(vnode) {
		// Parse attributes and set default value
		let subPage = vnode.attrs.subpage
		if (typeof subPage !== "string") subPage = ""

		let subPageData = parseSubPage(subPage)
		sidebarActiveIdx = subPageData.sidebarIndex

		return m(".root",
			m(Sidebar, {
				class: "root__sidebar",
				items: sidebarItems,
				activeIdx: sidebarActiveIdx,
				onItemSelected(idx) { sidebarActiveIdx = idx }
			}),
			m(subPageData.component, {
				class: "root__content"
			})
		)
	}

	return {
		view: renderView
	}
}