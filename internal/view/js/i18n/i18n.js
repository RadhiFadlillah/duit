import English from "./english.min.js"
import Indonesia from "./indonesia.min.js"

// Local variable and methods
let activeDictionary

function activateDictionary() {
	// If dictionary already active, stop
	if (activeDictionary instanceof Map) return

	// Load dictionary
	let lang = localStorage.getItem("duit-language")
	switch (lang) {
		case "en": activeDictionary = English; break
		case "id": activeDictionary = Indonesia; break
		default: activeDictionary = English
	}
}

// Public methods
export function setLanguage(lang) {
	localStorage.setItem("duit-language", lang)
}

export function i18n(key) {
	activateDictionary()
	return activeDictionary.get(key) || key
}

export function formatNumber(val, decimalPlace) {
	return Number(val).toLocaleString(i18n("locale"), {
		maximumFractionDigits: decimalPlace || 0
	})
}

export function formatDate(str) {
	let parts = str.split("-"),
		year = parseInt(parts[0], 10) || 1,
		month = parseInt(parts[1], 10) || 1,
		day = parseInt(parts[2], 10) || 1,
		monthName = ""

	switch (month) {
		case 1: monthName = i18n("January"); break
		case 2: monthName = i18n("February"); break
		case 3: monthName = i18n("March"); break
		case 4: monthName = i18n("April"); break
		case 5: monthName = i18n("May"); break
		case 6: monthName = i18n("June"); break
		case 7: monthName = i18n("July"); break
		case 8: monthName = i18n("August"); break
		case 9: monthName = i18n("September"); break
		case 10: monthName = i18n("October"); break
		case 11: monthName = i18n("November"); break
		case 12: monthName = i18n("December"); break
	}

	return `${day} ${monthName} ${year}`
}