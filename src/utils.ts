const LS_PREFIX = "GUN_UI"
export const lsGet = (key: string, def: any) => {
	try {
		const valueJSON = window.localStorage.getItem(`${LS_PREFIX}_${key}`)
		// console.log(`valueJSON`, valueJSON, valueJSON ? JSON.parse(valueJSON) : def)
		return valueJSON ? JSON.parse(valueJSON) : def
	} catch (_) {
		// console.log(`valueJSON _`, _)
		return def
	}
}
export const lsSet = (key: string, val: any) => {
	window.localStorage.setItem(`${LS_PREFIX}_${key}`, JSON.stringify(val))
}
export const lsPatchObject = (key: string, val: any) => {
	const existingValue = lsGet(key, {})
	lsSet(key, { ...existingValue, ...val })
}

// @ts-ignore
window.lsGet = lsGet
// @ts-ignore
window.lsSet = lsSet
// @ts-ignore
window.lsPatchObject = lsPatchObject