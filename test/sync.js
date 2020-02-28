const FILE_PARAM = './tmpSync/'
const PORT_PARAM = '8762'
const TIMEDIFF = 30 //ms

const _log = console.log
console.log = () => { }
const Gun = require('gun')

const assert = require('assert')
const { spawn } = require('child_process')
const rmrf = require('rmrf')

describe('sync data', function () {
    let server_process
    let server_output = ''
    // const gun = Gun({file: FILE_PARAM})
    let gunA
    let gunB

    before(function (done) {
        // runs before all tests in this block


        server_process = spawn('node', ['./bin/index.js', '--no-color', '--file', FILE_PARAM, '--port', PORT_PARAM])
        server_process.stdout.on('data', (data) => {
            server_output += data.toString()
            // process.stdout.write(`>>> ${data}`)
            // process.stdout.write(`>>> ${data.toString().replace(/\n/g, '\n>>> ')}`)
        })
        setTimeout(() => {
            gunA = Gun(`http://127.0.0.1:${PORT_PARAM}/gun`)
            gunB = Gun(`http://127.0.0.1:${PORT_PARAM}/gun`)
            done()
        }, 1000)
    })


    after(function (done) {
        server_process.on('close', (code) => {
            rmrf(FILE_PARAM)
            done()
        })

        server_process.kill('SIGINT')
    })

    it('should sync a put between two peers within a very short time', function (done) {
        gunA.get('synced').get('now').put(0)
        gunA.get('synced').get('now').on(ts => {
            if(ts === 0)
                return //process.stdout.write('skip no ts')
            const diff = Date.now() - ts
            // process.stdout.write(`ts: ${ts}; diff ${diff} --- ${diff < TIMEDIFF}\n`)
            assert(diff < TIMEDIFF)
            done()
        })
        setTimeout(() => {
            gunB.get('synced').get('now').put(Date.now())
        }, 1000)
    })
})