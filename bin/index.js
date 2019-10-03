#!/usr/bin/env node

const monitorctrlc = require('monitorctrlc')

const minimist_options =
	{	default:
		{	port: 8765
		,	host: '0.0.0.0'
		,	file: './db/'
		,	radisk: true
		}
	}
const config = require('minimist')(process.argv.slice(2), minimist_options)

const Gun = require('gun')
const server = require('http').createServer().listen(config.port, config.host)
const gun = Gun({...config, web: server})


monitorctrlc.monitorCtrlC(() => {
	console.log(`bye.`)
	process.exit()
})


// use setTimeout to print after the output on Gun()
setTimeout(()=> {
	console.log()
	console.log(`Gun node running at http://${config.host}:${config.port}/gun`)
	console.log(`To stop the server, press Ctrl+C`)
})
