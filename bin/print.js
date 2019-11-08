const colors = require('colors/safe')
const fs = require('fs')

module.exports = function cmd_print(config, cb) {
	const node_path = config._[1]
	if(!node_path)
		return cb(201, `missing parameter <PATH>`, true)

	const Gun = require('gun')
	const gun_path = require('gun/lib/path')
	const gun_load = require('gun/lib/open')
	const gun = Gun({...config})

	config.indent = config.indent || '  '

	const print_data = data => {
		if(config.out)
			fs.writeFileSync(config.out, stringify(data, config.indent))
		else
			console.log(`${colors.yellow(node_path)} =>`, colors.brightCyan(stringify(data, config.indent)))
		cb(0)
	}


	function afterinit() {
		let once_opts = {}
		let timed_out
		if(config.timeout > 0) {
			once_opts.wait = config.timeout
			timed_out = setTimeout(() => {
				timed_out = true
				return cb(203, `No data found at ${colors.underline(node_path)} within ${config.timeout} ms`)
			}, config.timeout)
		}

		gun.path(node_path).once(once_data => {
			if(timed_out === true)
				return
			else
				clearTimeout(timed_out)

			if(once_data === undefined)
				return cb(202, `No data found at ${colors.underline(node_path)}`)

			console.log()
			const out = config.out ? ` to file ${colors.brightBlue(config.out)}` : ''
			console.log(`Printing node ${colors.brightBlue(node_path)}` + out)
			console.log()

			if(config.debounce === 0)
				gun.path(node_path).open(print_data)
			else
				gun.path(node_path).open(debounce_data_fn(print_data, config.debounce || 50))
		}, once_opts)
	}


	// use setTimeout to print after the output on Gun()
	setTimeout(afterinit)
}

function debounce_data_fn(fn, ms) {
	let timeout
	return (data) => {
		if(timeout)
			clearTimeout(timeout)
		timeout = setTimeout(fn, ms, data)
	}
}

function stringify (obj, spcr) {
	const getCircularReplacer = () => {
		const seen = new WeakSet()
		return (key, value) => {
		if (typeof value === "object" && value !== null) {
			if (seen.has(value)) {
			return
			}
			seen.add(value)
		}
		return value
		}
	}
	return JSON.stringify(obj, getCircularReplacer(), spcr || '\t')
}