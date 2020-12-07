const music = {
	name: "music catalog",
	bands: [
		{
			name: "The Beatles",
			details: {
				founded: "1959",
				origin: "Liverpool",
				members: [
					{name: "John Lennon"},
					{name: "Paul McCartney"},
					{name: "George Harrison"},
					{name: "Ringo Starr"},
				]
			},
			genre: "Beat music",
			albums: [
				{
					name: "Help!",
					songs: [
						{
							name: "Yesterday",
							lyrics: "all my troubles seemed so far away",
							type: "sad",
						},

						{ name: "Help", lyrics: "I need somebody", type: "fun" },
					],
				},
				{
					name: "Sergeant Pepper",
					songs: [
						{
							name: "Fixing a hole",
							lyrics: "where the rain gets in",
							type: "sad",
						},
						{
							name: "A Day in the Life",
							lyrics: "fill the albert hall",
							type: "sad",
						},
						{
							name: "lovely Rita",
							lyrics: "nothing can come between us",
							type: "fun",
						},
					],
				},
			],
		},
	],
}

const insert = (startNode, data, depth, path) => {
	if (!gun) return
	depth = depth || 0
	path = path || "X"
	if (typeof startNode === "string") startNode = gun.get(startNode)

	if (Array.isArray(data)) {
		data.forEach((dat, i) => {
			// const key = (Math.random() * 1e6).toString(32)
			const key = `${path}[${i}]`
			const datNode = insert(key, dat, depth + 1, key)
			startNode.set(datNode)
		})
		return startNode
	} else
		switch (typeof data) {
			case "boolean":
			case "number":
			case "string":
			case "undefined":
			case "bigint":
				if (depth === 0)
					throw new Error(`cannot set top level value to primitive`)
				return startNode.put(data)

			case "function":
			case "symbol":
				throw new Error(`unsupported primitive`)

			case "object":
			default:
				for (const key in data) {
					console.log(`insert ${key}`)
					insert(startNode.get(key), data[key], depth + 1, `${path}-${key}`)
				}
				return startNode
		}
	// for(key in data) {
	// 	if(Array.isArray(data[key])) {
	// 		data[key].forEach((dataValue, i) => {
	// 			// const dataNode = gun.get(`${path}-${key}-${i}`).put(dataValue)
	// 			if(Array.isArray(dataValue))
	// 				insert(startNode.get(key), dataValue)
	// 			startNode.get(key).set(dataValue)
	// 		})
	// 	}
	// 	else
	// 		const keyNode = startNode.get(key).put(data[key])
	// 	// const keyNode = gun.get(`${path}-${key}`).put({ value: data[key] })
	// }
}
insert("music", music, 0)

const query = `{
 music {
  name
  bands[] {
   name
   details {
    origin
   }
   genre
   albums[] {
    name
    songs[] {
     name
     lyrics
     type
    }
   }
  }
 }
}`
