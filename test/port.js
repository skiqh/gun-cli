const FILE_PARAM = './tmpPort/'
const PORT_PARAM = '8760'


const _log = console.log
console.log = () => { }
const Gun = require('gun')

const assert = require('assert')
const { spawn } = require('child_process')
const rmrf = require('rmrf')

describe(`serve --port ${PORT_PARAM}`, function () {
    let server_process
    let server_output = ''

    before(function (done) {
        // runs before all tests in this block
        this.timeout(5000)

        Gun({ file: FILE_PARAM }).get('defaults').put({ foo: 'bar' }, () => {
            setTimeout(() => {
                server_process = spawn('node', ['./bin/index.js', '--no-color', '--file', FILE_PARAM, '--port', PORT_PARAM])
                server_process.stdout.on('data', (data) => {
                    server_output += data.toString()
                    // process.stdout.write(`>>> ${data}`)
                    // process.stdout.write(`>>> ${data.toString().replace(/\n/g, '\n>>> ')}`)
                })
                setTimeout(done, 200)
            })
        })

    })


    after(function (done) {
        server_process.on('close', (code) => {
            rmrf(FILE_PARAM)
            done()
        })
        server_process.kill('SIGINT')
    })

    it(`should serve data on a custom port`, function (done) {
        const gun = Gun(`http://127.0.0.1:${PORT_PARAM}/gun`)

        gun.get('defaults').get('foo').once(foo => {
            assert(foo === 'bar')
            done()
        })
    })
})