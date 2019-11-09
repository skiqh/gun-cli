# gun-cli
**`gun` runs a [GUN](https://gun.eco) server from your command line**

GUN is a distributed, offline-first, realtime graph database engine 
with built-in encryption. It's a small, easy, and fast data sync and 
storage system that runs everywhere JavaScript does. 


# Installation

	yarn global add gun-cli     OR     npm install -g gun-cli


## Example: Watching an expression

**start a local gun peer**

```console
gun --host 127.0.0.1 --watch foo.bar
```

**access it from your browser**

```html
<html>
	<script src="https://cdn.jsdelivr.net/npm/gun/gun.js"></script>
	<script>
		const gun = Gun('http://127.0.0.1:8765/gun')
		gun.get('foo').get('bar').put('baz ' + Date.now())
	</script>
</html>
```

**see `foo.bar` update in your command line**

```console
22:41:50        foo.bar => "baz 1570135310381"
```

## Example: Load and print data from a remote peer

```console
gun print flux.bar --file false --peers 127.0.0.1 --debounce 200 --timeout 2000
```

This will try to load `flux.bar` from `http://127.0.0.1:8765/gun` (extending the provided 
IP to a full gun URL with the default port `8765`). If the query does not resolve within 
two seconds, the attempt will timeout. However, if the peer can resolve our query, the 
answers that do come streaming in are debounced with a 200 ms interval, i.e. we try to 
wait for a full `.load()` of the data we're interested in. 

## Example: Using https

```console
ls ./mydomain-certs
> chain.pem fullchain.pem privkey.pem

gun --port 443 --certs ./mydomain-certs
```

Under the hood, this just uses `require('https').createServer()` with the respective 
params `ca`, `cert`, and `key`. 


## Example: Creating a redundant mesh network

![Connecting two browsers, A and B, over a mesh of gun peers, 1 through 4](https://skiqh.github.io/gun-cli/img/mesh-network.svg)

**start a small mesh network of gun servers**

```console
gun --host 127.0.0.1 --peers 127.0.0.3,127.0.0.4  # 1
gun --host 127.0.0.2 --peers 127.0.0.3,127.0.0.4  # 2

gun --host 127.0.0.3 --peers 127.0.0.1,127.0.0.2  # 3
gun --host 127.0.0.4 --peers 127.0.0.1,127.0.0.2  # 4
```

**connect two browsers, A and B, over this network**

**Browser A**
```html
<html>
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
```

**Browser B**

```html
<html>
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
```

**now play around with shutting down individual peers and bringing them back online**

As long as there is a path through the mesh network, the heartbeats will propagate from B to A. 

But if peers 1 and 2 (or peers 3 and 4) simultainiously go down, A and B are seperated 
and updates won't go through. However, GUN peers will try to reestablish the connection 
to a lost peer, so as soon as you bring one of the peers back online, they will reconnect 
and updates will go through again. 



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
