# gun-cli
**`gun`** runs a GUN server from your command line

# Getting started

**installation**

	yarn global add gun-cli     OR     npm install -g gun-cli

**start a gun server locally**

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



# Usage

	gun [command] [options]

	COMMANDS
	serve                                [default] spin up a gun server on http
	print PATH                           load NODEPATH and print as JSON


	GENERAL OPTIONS
	--no-color                           don't use any colors in output
	--debug                              print GUN debug info

	[serve] OPTIONS
	--host STRING            0.0.0.0     set the ip to listen on
	--port NUMBER            8765        set the port to listen on
	--file STRING            ./db/       set gun's file parameter
	--peers STRING,STRING                comma-seperated list of peers
	--watch PATH                         log changes with gun.path(PATH).on()
	--certs PATH                         point to a folder containing certificate files
	                                     (named privkey.pem, fullchain.pem, chain.pem)

	[print] OPTIONS
	--file STRING            ./db/       set gun's file parameter
	--out PATH                           print output to file at PATH
	--indent STRING                      indent characters for JSON output