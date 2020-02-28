const FILE_PARAM = './tmpWatch/'
const PORT_PARAM = '8761'


const _log = console.log
console.log = () => {}
const Gun = require('gun')

const assert = require('assert')
const { spawn } = require('child_process')
const rmrf = require('rmrf')

describe('serve --watch', function() {
	let server_process
	let server_output = ''
	// const gun = Gun({file: FILE_PARAM})
	let gun

	before(function(done) {
		// runs before all tests in this block

		
		server_process = spawn('node', ['./bin/index.js', '--no-color', '--file', FILE_PARAM, '--port', PORT_PARAM, '--watch', 'watch.foo'])
		server_process.stdout.on('data', (data) => {
			server_output += data.toString()
			// process.stdout.write(`>>> ${data}`)
			// process.stdout.write(`>>> ${data.toString().replace(/\n/g, '\n>>> ')}`)
		})
		setTimeout(() => {
			gun = Gun(`http://127.0.0.1:${PORT_PARAM}/gun`)
			done()
		}, 1000)
	})


	after(function(done) {
		server_process.on('close', (code) => {
			rmrf(FILE_PARAM)
			done()
		})
		server_process.kill('SIGINT')
	})

	it('should not emit non-existing value', function(done) {
		output_contains_no(`watch.foo =>`, 100, done)
	})
	
	it('should emit existing value ("bar")', function(done) {
		output_contains(`watch.foo => "bar"`, 100, done)
		setTimeout(() => {
			gun.get('watch').get('foo').put('bar')
		}, 200)
	})

	it('should emit updated value ("baz")', function(done) {
		output_contains(`watch.foo => "baz"`, 100, done)
		setTimeout(() => {
			gun.get('watch').get('foo').put('baz')
		}, 200)
	})

	function output_contains_no(str, int, cb) {
		// console.error('running output_contains_no')
		const test = () => {
			return !server_output.includes(str)
		}

		let resolved = false
		const resolve = (val) => {
			if(resolved)
				return
			resolved = true
			cb()
		}
		const attempt = (left) => {
			if(left <= 0 && test())
				return cb()
			setTimeout(attempt, int, left-int)
		}
		attempt(int*10)
		// setTimeout(attempt, int, int*10)
	}

	function output_contains(str, int, cb) {
		// console.error('running output_contains')
		const test = (left) => {
			return server_output.includes(str)
		}
		if(test() === true)
			return cb()

		let resolved = false
		const resolve = (val) => {
			if(resolved)
				return
			resolved = true
			cb()
		}
		const attempt = (left) => {
			if(left <= 0)
				return
			if(test(left))
				return cb()
			
			setTimeout(attempt, int, left-int)
		}

		setTimeout(attempt, int, int*10)
	}
})