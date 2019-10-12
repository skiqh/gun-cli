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

	function afterinit() {


		gun.path(node_path).once(once_data => {
			if(once_data === undefined)
				return cb(202, `No data found at ${colors.underline(node_path)}`)

			console.log()
			const out = config.out ? ` to file ${colors.brightBlue(config.out)}` : ''
			console.log(`Printing node ${colors.brightBlue(node_path)}` + out)
			console.log()
			gun.path(node_path).open(data => {
				if(config.out)
					fs.writeFileSync(config.out, stringify(data, config.indent))
				else
					console.log(`${colors.yellow(node_path)} =>`, colors.brightCyan(stringify(data, config.indent)))
			})
			cb()
		})

	}

	// use setTimeout to print after the output on Gun()
	setTimeout(afterinit)
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