#!/usr/bin/env node
const usage = `
gun [command] [options]

COMMANDS
serve                                [default] spin up a gun server on http
print PATH                           load NODEPATH and print as JSON


GENERAL OPTIONS
--no-color                           don't use any colors in output
--debug                              print GUN debug info

[serve] OPTIONS
--host STRING            0.0.0.0     set the ip to listen on
--port NUMBER            8765        set the port to listen on
--file STRING            ./db/       set gun's file parameter
--peers STRING,STRING                comma-seperated list of peers
--watch PATH                         log changes with gun.path(PATH).on()
--certs PATH                         point to a folder containing certificate files
                                     (named privkey.pem, fullchain.pem, chain.pem)

[print] OPTIONS
--file STRING            ./db/       set gun's file parameter
--out PATH                           print output to file at PATH
--indent STRING                      indent characters for JSON output
`

const minimist = require('minimist')
const monitorctrlc = require('monitorctrlc')
const colors = require('colors/safe')

const minimist_options =
	{	default:
		{	port: 8765
		,	host: '0.0.0.0'
		,	file: './db/'
		}
	}
const config = minimist(process.argv.slice(2), minimist_options)

monitorctrlc.monitorCtrlC(() => {
	console.log(colors.gray(`bye.`))
	process.exit()
})



const command_name = config._[0] || 'serve'
if(command_name === 'help' || !!config.help)
	return command_cb(0, null, true)
try {
	const command_fn = require(`./${command_name}`)
	const command_res = command_fn(config, command_cb)
	if(command_res && !config.norepl) {
		const repl = require('repl').start('> ')
		for(key in command_res)
			repl.context[key] = command_res[key]
	}
}
catch(ex) {
	if(ex && ex.code === 'MODULE_NOT_FOUND')
		command_cb(101, `unknown command ${colors.underline(command_name)}`, true)
	else
		console.log(`ERROR`, ex)
}



function command_cb(err_code, err_string, print_usage) {
	if(err_string)
		console.log(colors.brightRed(`\nERROR: ${err_string}\n`))
	if(print_usage) {
		console.log(usage)
	}
	if(typeof err_code === 'number')
		process.exit(err_code)
	else if(err_string)
		process.exit(1)
	else
		console.log(colors.brightRed(`To stop, press Ctrl+C`))
}
