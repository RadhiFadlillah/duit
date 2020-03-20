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
	let localUser = localStorage.getItem("duit-user") || "null"
	return JSON.parse(localUser)
}

export function mergeObject(base, obj) {
	let baseObject = cloneObject(base)

	for (const key in obj) {
		baseObject[key] = obj[key]
	}

	return baseObject
}
