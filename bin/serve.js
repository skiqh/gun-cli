const colors = require("colors/safe")
const fs = require("fs")
const path = require("path")

module.exports = function cmd_serve(config, cb) {
	if (config.debug) process.env.GUN_ENV = "debug"

	const Gun = require("gun")
	require("gun/lib/path")

	if (config.webrtc) {
		console.log(`loading webrtc`)
		require("gun/lib/webrtc")
	}

	const gun_config = { ...config }

	const found_key = fs.existsSync(path.resolve("./certs/key.pem"))
	const found_cert = fs.existsSync(path.resolve("./certs/cert.pem"))
	const found_ca = fs.existsSync(path.resolve("./certs/ca.pem"))

	if (!config.nocerts && found_key && found_cert && found_ca)
		config.certs = "./certs"

	if (config.certs) {
		try {
			const http_config = {
				key: fs.readFileSync(path.resolve(config.certs, "key.pem")),
				cert: fs.readFileSync(path.resolve(config.certs, "cert.pem")),
				ca: fs.readFileSync(path.resolve(config.certs, "ca.pem"))
			}
			gun_config.web = require("https").createServer(http_config)
		} catch (https_ex) {
			if (https_ex.code === "EACCES")
				return cb(301, `not allowed to access certificates`)

			console.log(`https_ex`, https_ex)
			return cb(310, "could not start an https server")
		}
	} else {
		gun_config.web = require("http").createServer()
	}

	gun_config.web.listen(config.port, config.host)
	const gun = Gun(gun_config)

	// Sync everything: source: https://github.com/zrrrzzt/bullet-catcher
	// gun.on('out', {get: {'#': {'*': ''}}})

	function watch(pth, cb) {
		if (!pth) return cb()

		const node = gun.path(pth)
		node.once(_ => {
			console.log(colors.gray(`Watch: ${colors.yellow(pth)}`))

			cb()
			node.on(data => {
				console.log(
					`${new Date().toLocaleTimeString()}\t${colors.yellow(pth)} =>`,
					colors.brightGreen(JSON.stringify(data, null, "\t"))
				)
			})
		})
	}

	function afterinit() {
		const server_url = colors.brightBlue.underline(
			`${config.certs ? "https" : "http"}://${config.host}:${config.port}/gun`
		)
		const peers =
			config.peers &&
			Object.keys(config.peers)
				.map(p => colors.yellow(p))
				.join(", ")
		console.log()
		console.log(`Gun node running at ${server_url}`)
		console.log()
		console.log(colors.gray(`File:  ${colors.yellow(config.file)}`))

		if (config.certs)
			console.log(colors.gray(`Certs: ${colors.yellow(config.certs)}`))
		if (peers) console.log(colors.gray(`Peers: ${peers}`))
		watch(config.watch, cb)
	}

	// use setTimeout to print after the output on Gun()
	setTimeout(afterinit)
	return { gun }
}
