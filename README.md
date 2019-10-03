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

	gun [options]

	OPTIONS
	--host STRING            0.0.0.0     set the ip to listen on
	--port NUMBER            8765        set the port to listen on
	--file STRING            ./db/       set gun's file parameter
	--peers STRING,STRING                comma-seperated list of peers' ips
	--watch PATH                         log changes with gun.path(PATH).on()

