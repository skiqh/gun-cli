const FILE_PARAM = './tmpDefaults/'


const _log = console.log
console.log = () => {}
const Gun = require('gun')

const assert = require('assert')
const { spawn } = require('child_process')
const rmrf = require('rmrf')

describe('serve [defaults]', function() {
	let server_process
	let server_output = ''

	before(function(done) {
		// runs before all tests in this block
		this.timeout(5000)

		Gun({file: FILE_PARAM}).get('defaults').put({foo:'bar'}, () => {
			setTimeout(() => {
				server_process = spawn('node', ['./bin/index.js', '--no-color', '--file', FILE_PARAM])
				server_process.stdout.on('data', (data) => {
					server_output += data.toString()
					// process.stdout.write(`>>> ${data}`)
					// process.stdout.write(`>>> ${data.toString().replace(/\n/g, '\n>>> ')}`)
				})
				setTimeout(done, 200)
			})
		})

	})


	after(function(done) {
		server_process.on('close', (code) => {
			rmrf(FILE_PARAM)
			done()
		})
		server_process.kill('SIGINT')
	})

	it('should tell when it\'s ready', function(done) {
		this.timeout(12000)
		output_contains(`To stop, press Ctrl+C`, 100, done)
	})

	it('should be available on 127.0.0.1:8765', function(done) {
		const gun = Gun('http://127.0.0.1:8765/gun')
		
		gun.get('defaults').get('foo').once(foo => {
			assert(foo === 'bar')
			done()
		})
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

		setTimeout(attempt, int, int*10)
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