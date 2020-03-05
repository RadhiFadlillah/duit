export function timeout(duration, promise) {
	let ms = duration

	if (typeof duration == "string") {
		let unitName = duration.replace(/^\d+/, "")

		ms = parseInt(duration, 10)
		switch (unitName) {
			case "s":
				ms *= 1000
				break
			case "M":
				ms *= 60 * 1000
				break
			case "H":
				ms *= 60 * 60 * 1000
				break
			default:
				ms = 0
		}
	}

	if (ms === 0) return promise
	else return new Promise((resolve, reject) => {
		setTimeout(() => reject(new Error(`Timeout after ${duration}`)), ms)
		promise.then(resolve, reject)
	})
}

export async function request(url, ms, options) {
	let fetchRequest = fetch(url, options),
		response = await (timeout(ms, fetchRequest))

	if (!response.ok) {
		let responseText = await response.text()
		throw Error(`${responseText.trim()} (${response.status})`)
	}

	if (response.headers.get("content-type") === "application/json") {
		return await response.json()
	}

	return await response.text()
}

export function cloneObject(src) {
	return JSON.parse(JSON.stringify(src))
}

export function getActiveUser() {
	let localUser = localStorage.getItem("user") || "null"
	return JSON.parse(localUser)
}

export function searchTree(tree, value, parent) {
	if (typeof parent != "object") parent = null
	if (!Array.isArray(tree) || tree.length === 0) {
		return null
	}

	for (let i = 0; i < tree.length; i++) {
		let item = tree[i]
		if (item.value === value) {
			return { data: item, parent: parent }
		}

		let result = searchTree(item.children, value, item)
		if (result != null) {
			return result
		}
	}

	return null
}

export function debounce(fn, time) {
	let timeout;

	return function () {
		const functionCall = () => fn.apply(this, arguments);

		clearTimeout(timeout);
		timeout = setTimeout(functionCall, time);
	}
}

export function evalMath(expr) {
	if (expr === "") return

	try {
		return Number(Function(`"use strict";return (${expr})`)())
	} catch (e) {
		return e.message
	}
}

export function copyToClipboard(str) {
	var el = document.createElement("textarea");

	el.value = str;
	el.setAttribute("readonly", "")
	el.style.opacity = "0"
	el.style.maxWidth = "0"
	el.style.maxHeight = "0"

	document.body.appendChild(el)
	el.select();

	document.execCommand("copy")
	document.body.removeChild(el);
}

export function mergeObject(base, obj) {
	let baseObject = cloneObject(base)

	for (const key in obj) {
		baseObject[key] = obj[key]
	}

	return baseObject
}