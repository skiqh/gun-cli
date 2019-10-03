#!/usr/bin/env node

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
const gun = Gun({web: server, file: config.file, radisk: config.radisk})

console.log(`connect to your local gun node at http://${config.host}:${config.port}/gun`)