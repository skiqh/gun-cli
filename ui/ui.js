var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height"),
	color = d3.scaleOrdinal(d3.schemeCategory10)

var a = { id: "a" }
var b = { id: "b" }
var c = { id: "c" }
// nodes = [a, b, c],
// links = []

const nodesById = new Map()
const linksByConnection = new Map()

var simulation = d3
	.forceSimulation([])
	.force(
		"center",
		d3
			.forceCenter()
			.x(width * 0.1)
			.y(height * 0.1)
	)
	.force("charge", d3.forceManyBody().strength(-250))
	.force("link", d3.forceLink([]).distance(150))
	// .force(
	// 	"collision",
	// 	d3.forceCollide(20)
	// )
	.force("x", d3.forceX())
	.force("y", d3.forceY())
	.alphaDecay(0.25)
	// .alphaTarget(0.9)
	.on("tick", ticked)

var rootg = svg
	.append("g")
	.attr("name", "root")
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
var link_g = rootg
	.append("g")
	.attr("name", "links")
	.attr("stroke", "#000")
	.attr("stroke-width", 1.5)

var edges_g = rootg.append("g").attr("name", "edges")
var node_g = rootg.append("g").attr("name", "nodes")

const edgeHeight = 11
const edgeThickness = 3
// edgepaths = rootg.append("g").selectAll(".edgepath")
// edgelabels = rootg.append("g").selectAll(".edgelabel")

restart()

function restart() {
	// Apply the general update pattern to the node-data.
	var nodeData = Array.from(nodesById).map(([id, node]) => node)
	var linkData = Array.from(linksByConnection).map(([id, link]) => link)
	console.log(`RAW nodeData`, nodeData)
	console.log(`RAW linkData`, linkData)

	var allNodes = node_g.selectAll(".node").data(nodeData, function (d) {
		return d.id
	})
	allNodes.exit().remove()

	var enterNodes = allNodes
		.enter()
		.append("g")
		.attr("class", "node")
		.on("click", async (node) => {
			console.log(`click`, node.id)
			if (!node.id) return

			const res = await exploreNode(node.id, 1, true)
			console.log(`res`, res)
		})
		.call(
			d3
				.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended)
		)
	enterNodes
		.append("circle")
		.attr("stroke", "#fff")
		.attr("stroke-width", 1.5)
		.attr("fill", function (d) {
			return color(d.id)
		})
		.attr("r", 8)
	enterNodes
		.append("text")
		.attrs({ class: "node-text", stroke: "#fff", "stroke-width": 3 })
		.attr("dx", 12)
		.html(function (d) {
			return `${d.value && d.value.label}`
		})
	enterNodes
		.append("text")
		.attrs({ class: "node-text", fill: '#000' })
		.attr("dx", 12)
		.html(function (d) {
			return `${d.value && d.value.label}`
		})
	allNodes = allNodes.merge(enterNodes)

	// var allLinks = link.data(linkData, function (d) {return d.source.id + "-" + d.target.id})
	// allLinks.exit().remove()
	// var enterLinks = allLinks
	// .enter()
	// .append("line")
	// .attr("class", "link")
	// allLinks = allLinks.merge(enterLinks)

	var allEdges = edges_g.selectAll(".edge").data(linkData)
	allEdges.exit().remove()

	var enterEdges = allEdges
		.enter()
		.append("g")

	enterEdges
		.append("rect")
		.attr('class', 'line')
		.attrs({ x: 0, y: -1* edgeThickness/2, height: edgeThickness, fill: "#ddd" })
	// enterEdges
	// 	.append("rect")
	// 	.attr('class', 'bg')
	// 	.attrs({ y: -0.5 * edgeHeight, height: 11, fill: "#fff" })
	enterEdges
		.append("text")
		.attrs({ dy: 0.25 * edgeHeight, "font-size": 12, stroke: '#fff', 'stroke-width': 3 })
		.text(function(d) {
			return d.type
		})
	enterEdges
		.append("text")
		.attrs({ dy: 0.25 * edgeHeight, fill: "#999", "font-size": 12 })
		.text(function(d) {
			return d.type
		})

	var allLinks = link_g.selectAll(".link").data(linkData, function (d) {
		return d.source.id + "-" + d.target.id
	})
	allLinks.exit().remove()
	allLinks = allLinks.enter().append("line").merge(allLinks)

	// Update and restart the simulation.
	simulation.nodes(nodeData)
	simulation.force("link").links(linkData)
	simulation.alpha(1).restart()
}

function ticked() {
	node_g.selectAll(".node").attr("transform", function (d) {
		return "translate(" + d.x + ", " + d.y + ")"
	})
	// .attr("cx", function (d) {
	// 	return d.x
	// })
	// .attr("cy", function (d) {
	// 	return d.y
	// })

	link_g
		.selectAll("line")
		.attr("x1", function (d) {
			return d.source.x
		})
		.attr("y1", function (d) {
			return d.source.y
		})
		.attr("x2", function (d) {
			return d.target.x
		})
		.attr("y2", function (d) {
			return d.target.y
		})
	edges_g.selectAll("g").attrs(function (d) {
		const dx = d.target.x - d.source.x
		const dy = d.target.y - d.source.y
		// const angle = (180 * Math.atan(dx / dy)) / Math.PI
		const angle = (Math.atan2(dy, dx) * 180) / Math.PI
		const transform = `translate(${d.source.x},${d.source.y}) rotate(${angle})`
		return { transform }
	})
	edges_g.selectAll(".line").attrs(function (d) {
		const dx = d.target.x - d.source.x
		const dy = d.target.y - d.source.y
		const width = Math.sqrt(dx * dx + dy * dy)
		return { width }
	})
	// edges_g.selectAll(".bg").attrs(function (d) {
	// 	const dx = d.target.x - d.source.x
	// 	const dy = d.target.y - d.source.y
	// 	const width = 0.6*Math.sqrt(dx * dx + dy * dy)
	// 	const x = 0.2*Math.sqrt(dx * dx + dy * dy)
	// 	return { width, x }
	// })
	edges_g.selectAll("text").attrs(function (d) {
		const dx = d.target.x - d.source.x
		const dy = d.target.y - d.source.y
		const width = 0.5*Math.sqrt(dx * dx + dy * dy)
		const x = 0.45*Math.sqrt(dx * dx + dy * dy)
		return { width, x }
	})
	// .attr("x1", function (d) {
	// 	return d.source.x
	// })
	// .attr("y1", function (d) {
	// 	return d.source.y
	// })
	// .attr("x2", function (d) {
	// 	return d.target.x
	// })
	// .attr("y2", function (d) {
	// 	return d.target.y
	// })
	// .attr("transform", function (d) {
	// 	var bbox = this.getBBox()
	// 	// console.log(`update edgelabel`, d, bbox)
	// 	rx = bbox.x + bbox.width / 2
	// 	ry = bbox.y + bbox.height / 2

	// 	if (d.target.x < d.source.x) {
	// 		return `rotate(180 ${rx} ${ry})`
	// 	} else {
	// 		return `rotate(0,  ${rx} ${ry})`
	// 	}
	// })

	// edgepath_g
	// 	.selectAll(".edgepath")
	// 	.attr("d", function (d) {
	// 		return `M ${d.source.x} ${d.source.y} L  ${d.target.x} ${d.target.y}`
	// 	})
	// edgepath_g
	// 	.selectAll(".edgepathbg")
	// 	.attr("d", function (d) {
	// 		return `M ${d.source.x} ${d.source.y} L  ${d.target.x} ${d.target.y}`
	// 	})
	// edgelabels.attr("transform", function (d) {
	// 	var bbox = this.getBBox()
	// 	// console.log(`update edgelabel`, d, bbox)
	// 	rx = bbox.x + bbox.width / 2
	// 	ry = bbox.y + bbox.height / 2

	// 	if (d.target.x < d.source.x) {
	// 		return `rotate(180 ${rx} ${ry})`
	// 	} else {
	// 		return `rotate(0,  ${rx} ${ry})`
	// 	}
	// })
}

function dragstarted(d) {
	if (!d3.event.active) simulation.alphaTarget(0.3).restart()
	d.fx = d.x
	d.fy = d.y
}

function dragged(d) {
	d.fx = d3.event.x
	d.fy = d3.event.y
}
function dragended(d) {
	if (!d3.event.active) simulation.alphaTarget(0)
	d.fx = undefined
	d.fy = undefined
}
function play() {
	nodesById.set("a", a)
	nodesById.set("b", b)
	nodesById.set("c", c)
	d3.timeout(function () {
		linksByConnection.set("a-b", { source: a, target: b }) // Add a-b.
		linksByConnection.set("b-c", { source: b, target: c }) // Add b-c.
		linksByConnection.set("c-a", { source: c, target: a }) // Add c-a.
		// links.push({ source: a, target: b }) // Add a-b.
		// links.push({ source: b, target: c }) // Add b-c.
		// links.push({ source: c, target: a }) // Add c-a.
		restart()
	}, 1000)

	d3.interval(
		function () {
			// nodes.pop() // Remove c.
			nodesById.delete("c")
			linksByConnection.delete("c-a") // Remove c-a.
			linksByConnection.delete("b-c") // Remove b-c.
			// links.pop() // Remove c-a.
			// links.pop() // Remove b-c.
			restart()
		},
		2000,
		d3.now()
	)

	d3.interval(
		function () {
			// nodes.push(c) // Re-add c.
			nodesById.set("c", c)
			linksByConnection.set("b-c", { source: b, target: c }) // Add b-c.
			linksByConnection.set("c-a", { source: c, target: a }) // Add c-a.
			// links.push({ source: b, target: c }) // Re-add b-c.
			// links.push({ source: c, target: a }) // Re-add c-a.
			restart()
		},
		2000,
		d3.now() + 1000
	)
}

const gun = Gun({ peers: [location.href + "gun"] })

let fireRestartTimeout
function fireRestart() {
	clearTimeout(fireRestartTimeout)
	fireRestartTimeout = setTimeout(() => {
		console.log(`restart!`)
		restart()
	}, 100)
}

// let nodecountindex = 1
const visited = []

async function exploreNode(parentId, depthleft, force) {
	if (depthleft <= 0) return
	if (!force && visited.includes(parentId)) return
	visited.push(parentId)

	return new Promise((resolveNodeId) => {
		gun.get(parentId).once(
			async (parent) => {
				if (!parent) return
				const d3ParentNodeId = parentId //String.fromCharCode(64 + ++nodecountindex) //parentId.replace(/\//g, ':') //String.fromCharCode(64 + ++nodecountindex)
				const d3ParentNode = { id: d3ParentNodeId, value: parent }
				console.log(`add ${d3ParentNodeId}`)
				nodesById.set(d3ParentNodeId, d3ParentNode)
				for (key in parent) {
					if (key === "_") continue

					if (key[0] === ":") {
						console.log(`parent[key]`, parent[key])
						gun
							.get(parentId)
							.get(key)
							.map()
							.once(
								async (rellink) => {
									console.log(`rellink`, rellink)
									// resolveLink(rellink)
									const childId = rellink._["#"]
									const d3ChildNodeId = await exploreNode(
										childId,
										depthleft - 1
									)
									if (!d3ChildNodeId) return
									const connectionId = `${d3ParentNodeId}-${childId}`
									console.log(`add :link ${connectionId}`)
									linksByConnection.set(connectionId, {
										source: nodesById.get(d3ParentNodeId),
										target: nodesById.get(childId),
										type: key,
									})
									fireRestart()
								},
								{ wait: 100 }
							)
						continue
					}

					const child = parent[key]
					console.log(`parent[${key}]`, child)

					if (child["#"]) {
						const childId = child["#"]
						const d3ChildNodeId = await exploreNode(childId, depthleft - 1)
						if (!d3ChildNodeId) continue
						// const d3ChildNodeId = String.fromCharCode(64 + ++nodecountindex) //childId.replace(/\//g, ':') //String.fromCharCode(64 + ++nodecountindex)
						// const d3ChildNode = { id: d3ChildNodeId }
						const connectionId = `${d3ParentNodeId}-${childId}`
						console.log(`add link ${connectionId}`)
						linksByConnection.set(connectionId, {
							source: nodesById.get(d3ParentNodeId),
							target: nodesById.get(childId),
						})
					}
				}
				fireRestart()
				resolveNodeId(d3ParentNodeId)
			},
			{ wait: 100 }
		)
	})
	// gun.get(parentId).map((a, b, c) => {console.log(`a, b, c`, a, b, c); return a}).once((value, key) => {
	// 	console.log(parentId, 'kv', key, value)
	// 	nodesById.set(parentId, parent)
	// 	// fireRestart()
	// })

	// gun.get(parentId).once(
	// 	(parent) => {
	// 		if (!parent) return console.warn(`parent not found`)
	// 		parent.id = parentId
	// 		// parent.ref = parentId
	// 		nodesById.set(parentId, parent)
	// 		for (key in parent) {
	// 			console.log(`key`, key)
	// 			const child = { value: parent[key] }
	// 			const childId = `${parentId}--${key}`
	// 			child.id = childId
	// 			// child.ref = parentId
	// 			nodesById.set(childId, child)
	// 			linksByConnection.set(`${parentId}-->--${childId}`, {
	// 				source: parent,
	// 				target: child,
	// 			})
	// 		}
	// 		restart()
	// 		// console.log(`done.`)
	// 	},
	// 	{ wait: 100 }
	// )
}
exploreNode("julian", 5)
// play()
