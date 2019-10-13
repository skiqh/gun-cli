const colors = require('colors/safe')
const Gun = require('gun')
const gun_path = require('gun/lib/path')

module.exports = function cmd_serve(config, cb) {
	const server = require('http').createServer().listen(config.port, config.host)
	const gun = Gun({...config, web: server})

	function watch(pth, cb) {
		if(!pth)
			return cb()
		gun.path(pth).once(_ => {
			console.log(colors.gray(`Watch: ${colors.yellow(pth)}`))

			cb()
			gun.path(pth).on(data => {
				console.log(`${(new Date()).toLocaleTimeString()}\t${colors.yellow(pth)} =>`, colors.brightGreen(JSON.stringify(data, null, '\t')))
			})
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
		watch(config.watch, cb)
	}

	// use setTimeout to print after the output on Gun()
	setTimeout(afterinit)
	return {gun}
}