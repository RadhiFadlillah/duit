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

export function formatNumber(val) {
	return Number(val).toLocaleString("id-ID", {
		maximumFractionDigits: 0
	})
}

export function getDateParts(str) {
	let parts = str.split("-")

	return {
		year: parseInt(parts[0], 10) || 1,
		month: parseInt(parts[1], 10) || 1,
		day: parseInt(parts[2], 10) || 1,
	}
}

export function formatDate(str) {
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