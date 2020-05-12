#!/usr/bin/env node
const usage = `
gun [command] [options]

COMMANDS
serve                           [default] start a gun server on http
print NODEPATH                  load NODEPATH and print as JSON
version                         print version numbers and exit

GENERAL OPTIONS
--file PATH         ./gundata/  set file parameter of Gun()
--peers STRING                  comma-seperated list of URLs and IPs
                                (IPs are expanded to http://IP:8765/gun)
--no-color                      do not use any colors in output
--debug                         print GUN debug info
--silent                        reduce command line output
--repl                          go into a repl (with gun instace)

[serve] OPTIONS
--host STRING       0.0.0.0     set the ip to listen on
--port NUMBER       8765        set the port to listen on
--watch PATH                    log changes with gun.path(PATH).on()
--certs PATH        ./certs     use https with cert files from PATH
                                (key.pem, cert.pem, ca.pem)
--nocerts                       disable auto-discovery of ./certs
--webrtc            false       load lib/webrtc

[print] OPTIONS
--out FILENAME                  write to FILENAME instead of stdout
--indent STRING                 indent characters for JSON output
--debounce NUMBER   50          debounce .load() to resolve nested data
                                set to 0 to disable debouncing
--timeout NUMBER    1000        wait this much for answers to your request
`

const minimist = require("minimist")
const monitorctrlc = require("monitorctrlc")
const colors = require("colors/safe")
const net = require("net")

const minimist_options = {
	default: {
		port: 8765,
		host: "0.0.0.0",
		file: "./gundata/",
		repl: false,
		webrtc: false
	}
}
const config = minimist(process.argv.slice(2), minimist_options)

if (config.peers) {
	config.peers = config.peers
		.split(",")
		.map(peer => (net.isIP(peer) ? `http://${peer}:8765/gun` : peer))
		.reduce((acc, peer) => {
			acc[peer] = {}
			return acc
		}, {})
}

const command_name = config._[0] || "serve"
if (command_name === "help" || !!config.help) return command_cb(0, null, true)
if (command_name === "version" || !!config.version) {
	const g = require("gun")
	const pck = require("../package.json")
	return command_cb(0, `gun-cli: ${pck.version}\ngun:     ${g.version}`, false)
}

try {
	const command_fn = require(`./${command_name}`)
	const command_res = command_fn(config, command_cb)

	if (command_res) {
		monitorctrlc.monitorCtrlC(() => {
			console.log()
			console.log(colors.gray(`bye.`))
			process.exit()
		})
		if (config.repl) {
			const repl = require("repl").start("> ")
			for (key in command_res) repl.context[key] = command_res[key]
			repl.context["Gun"] = require("gun")
		}
	}
} catch (ex) {
	if (ex && ex.code === "MODULE_NOT_FOUND")
		command_cb(101, `unknown command ${colors.underline(command_name)}`, true)
	else console.log(`ERROR`, ex)
}

function command_cb(err_code, err_string, print_usage) {
	if (err_string) console.log(colors.brightRed(`\n${err_string}\n`))
	if (print_usage) {
		console.log(usage)
	}
	if (typeof err_code === "number") process.exit(err_code)
	else if (err_string) process.exit(1)
	else console.log(colors.brightRed(`To stop, press Ctrl+C`))
}
