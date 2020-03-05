function homeScreen() {
	function renderView() {
		return m(".home", "Hello")
	}

	return {
		view: renderView,
	}
}

export function startApp() {
	m.mount(document.body, homeScreen)
} 