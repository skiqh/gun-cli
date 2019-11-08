# gun-cli
`gun` runs a GUN server from your command line


# Installation

	yarn global add gun-cli     OR     npm install -g gun-cli


# Example usage

## Watching an expression

**start a local gun peer**

	gun --host 127.0.0.1 --watch foo.bar

**access it from your browser**

	<html>
		<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
		<script>
			const gun = Gun('http://127.0.0.1:8765/gun')
			gun.get('foo').get('bar').put('baz ' + Date.now())
		</script>
	</html>

**see `foo.bar` update in your command line**

	22:41:50        foo.bar => "baz 1570135310381"


## Load and print data from a remote peer

	gun print flux.bar --file false --peers 127.0.0.1 --debounce 200 --timeout 2000

This will try to load `flux.bar` from `http://127.0.0.1:8765/gun` (extending the provided 
IP with `http` and the default port `8765`). If the query does not resolve within two seconds, 
the attempt will timeout. However, if we get an answer, the answers that come streaming in 
are debounced with a 200 ms interval, i.e. we try to wait for a full `.load()` of the data 
we're interested in. 

## Running on https

	ls ./mydomain-certs
	> chain.pem fullchain.pem privkey.pem

	gun --port 443 --certs ./mydomain-certs


## Creating a redundant mesh network

![Connecting two browsers, A and B, over a mesh of gun peers, 1 through 4](https://skiqh.github.io/gun-cli/img/mesh-network.svg)

**start a small mesh network of gun servers**

	gun --host 127.0.0.1 --peers 127.0.0.3,127.0.0.4  # 1
	gun --host 127.0.0.2 --peers 127.0.0.3,127.0.0.4  # 2

	gun --host 127.0.0.3 --peers 127.0.0.1,127.0.0.2  # 3
	gun --host 127.0.0.4 --peers 127.0.0.1,127.0.0.2  # 4

**connect two browsers, A and B, over this network**

	<html>
		<title>Browser A</title>
		<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
		<script>
			const peers = [
				'http://127.0.0.1:8765/gun',
				'http://127.0.0.2:8765/gun'
			]
			const gun = Gun({peers})
			gun.get('foo').get('heartbeat').on(heartbeat => {
				const time = new Date(heartbeat).toLocaleTimeString()
				console.log(`last heartbeat was at ${time}`)
			})
		</script>
	</html>

	<html>
		<title>Browser B</title>
		<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
		<script>
			const peers = [
				'http://127.0.0.3:8765/gun',
				'http://127.0.0.4:8765/gun'
			]
			const gun = Gun({peers})
			setInterval(() => {
				gun.get('foo').get('heartbeat').put(Date.now())
			}, 1000)
		</script>
	</html>

**now play around with shutting down individual peers and bringing them back online**




# Usage

```
gun [command] [options]

COMMANDS
serve                           [default] start a gun server on http
print NODEPATH                  load NODEPATH and print as JSON
version                         print version numbers and exit

GENERAL OPTIONS
--file PATH         ./gundata/  set file parameter of Gun()
--peers STRING                  comma-seperated list of URLs and IPs
                                (IPs are expanded to http://IP:8765/gun)
--no-color                      do not use any colors in output
--debug                         print GUN debug info

[serve] OPTIONS
--host STRING       0.0.0.0     set the ip to listen on
--port NUMBER       8765        set the port to listen on
--watch PATH                    log changes with gun.path(PATH).on()
--certs PATH                    use https with cert files from PATH
                                (privkey.pem, fullchain.pem, chain.pem)

[print] OPTIONS
--out FILENAME                  write to FILENAME instead of stdout
--indent STRING                 indent characters for JSON output
--debounce NUMBER   50          debounce .load() to resolve nested data
                                set to 0 to disable debouncing
--timeout NUMBER    1000        wait this much for answers to your request
```