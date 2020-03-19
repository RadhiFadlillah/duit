import {
	Root,
} from "./pages/_pages.min.js";

export function startApp() {
	m.route(document.body, "/", {
		"/": Root,
		"/:page": Root,
	})
}