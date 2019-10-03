#!/usr/bin/env node

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

if(config.peers)
	config.peers = config.peers.split(',')

const Gun = require('gun')
const gun_path = require('gun/lib/path')
const server = require('http').createServer().listen(config.port, config.host)
const gun = Gun({...config, web: server})


monitorctrlc.monitorCtrlC(() => {
	console.log(colors.gray(`bye.`))
	process.exit()
})


function watch(pth) {
	if(!pth)
		return
	console.log(colors.gray(`Watch: ${colors.yellow(pth)}`))
	gun.path(pth).on(data => {
		console.log(`${(new Date()).toLocaleTimeString()}\t${colors.yellow(pth)} =>`, colors.brightCyan(JSON.stringify(data, null, '\t')))
	})
}

function afterinit() {
	const server_url = colors.brightBlue.underline(`http://${config.host}:${config.port}/gun`)
	const peers = config.peers && config.peers.map(p => colors.yellow(p)).join(', ')
	console.log()
	console.log(`Gun node running at ${server_url}`)
	console.log()
	console.log(colors.gray(`File:  ${colors.yellow(config.file)}`))
	if(peers)
		console.log(colors.gray(`Peers: ${peers}`))
	watch(config.watch)
	console.log()
	console.log(colors.brightRed(`To stop, press Ctrl+C`))
}

// use setTimeout to print after the output on Gun()
setTimeout(afterinit)