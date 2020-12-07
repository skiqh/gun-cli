import type { IGunStatic } from "gun/types/static"

const GUNFS_BASE = "GFS"
const GUNFS_HASH_ALGORITHM = "SHA-256"
const GUNFS_GET_MATCH = new RegExp(`^${GUNFS_BASE}/${GUNFS_HASH_ALGORITHM}/([A-Fa-f0-9]+)$`)
const GUNFS_MAX_SLICE_SIZE = 65535
const GUNFS_EOF = '<EOF>'


type GunContext = {
	opt: {
		mesh: {
			say: (msg:any, peer?:GunPeer) => void
			hear: any
		}
	}
	once: any
}
type GunThis = {
	to: {
		next: (ctx:GunContext) => void
	}
}

type ObtainMinimalCallback = {
	url: string
}
type FindingObject = {
	[key: string]: (blob: Blob) => Promise<void>
}
type PikingObject = {
	[key: string]: GunPeer
}
type GFSFilterFunction = (key:any) => boolean

type GFSHearMessage = {
	find: string
	found: string
	pick: string
}
type GunPeer = {
	ondatachannel: any
	id: string
	createDataChannel: (channelID: string) => GunFileChannel
}
type GunFileChannel = {
	binaryType: string
	onopen: any
	send: (message: string | ArrayBuffer) => void
}
type GunDatachannelEvent = {
	channel: any
}
type GunChannelMessageEvent = {
	data: string
}
type GunChannelOpenEvent = any
type GFSEntryInfo = {
	name: string
	hash: string
	fsid: string
	type: string
	size: number
	created: number
}
type GFSEntryHeaders = {
	"X-GFS-NAME": string
	"X-GFS-HASH": string
	"X-GFS-FSID": string
	"X-GFS-TYPE": string
	"X-GFS-SIZE": string
	"X-GFS-CREATED": string
	"X-GFS-ALGORITHM": string
	"Content-Type": string
	"Content-Length": string
}

// export async function installSW() {
// 	// gunfs.sw.js
// 	if (!("serviceWorker" in navigator)) return

// 	try {
// 		const registration = await navigator.serviceWorker.register("./gunfs.sw.js")
// 		console.log("Registration succeeded. Scope is ", registration.scope)
// 	}
// 	catch(registration_exception) {
// 		console.log("Registration failed with", registration_exception)
// 	}
// }

export async function registerGunFS(Gun: any) {
	Gun.on("opt", async function (this: GunThis, ctx: GunContext) {
		console.log(`registering gunfs`, ctx.opt.mesh)
		this.to.next(ctx)
		if (ctx.once) {
			return
		}
		// var opt = ctx.opt
		// var mesh = ctx.opt.mesh
		const gunfsCache:Cache = await window.caches.open(GUNFS_BASE)
		let finding: FindingObject = {}
		let picking: PikingObject = {}

		Gun.obtain = async function (fsid: string) {
			console.log(`[${GUNFS_BASE}] obtain`, fsid, ctx.opt.mesh)
			const fsidMatch = fsid && fsid.match(GUNFS_GET_MATCH)
			if (!fsidMatch) return Promise.reject("malformed fsid")

			const cacheResponse = await gunfsCache.match(fsid)

			if (cacheResponse) {
				const headers = headers_ResponseToObj(cacheResponse)
				const blob = await cacheResponse.blob()
				const url = window.URL.createObjectURL(blob)
				return { ...headers, url }
			} else {
				console.log(`[${GUNFS_BASE}] could not find ${fsid} in local cache`)
			}
			// Gun.opt.mesh.say({gfs: {obtain:fsid}})
			return new Promise(resolve => {
				finding[fsid] = async (blob:Blob) => {
					console.warn(`[${GUNFS_BASE}] found and delivered gfs file "${fsid}"`)
					const url = window.URL.createObjectURL(blob)
					return resolve({ url })
				}
				ctx.opt.mesh.say({ dam: "gfs", find: fsid })
			})
		}
		Gun.files = async function (filter: GFSFilterFunction) {
			const cachedKeys = await gunfsCache.keys()
			const ret = cachedKeys
				.filter(key => !filter || filter(key))
				.map(async key => {
					const cacheResponse = await gunfsCache.match(key)
					if(!cacheResponse || typeof cacheResponse["blob"] !== "function")
						return
					const headers = headers_ResponseToObj(cacheResponse)
					const blob = await cacheResponse.blob()
					const url = window.URL.createObjectURL(blob)
					return { ...headers, url }
				})
			return Promise.all(ret)
		}
		Gun.store = async function (file:File) {
			if (!file) return console.error(`[${GUNFS_BASE}] no file provided`)

			console.log(`[${GUNFS_BASE}] generating ${GUNFS_HASH_ALGORITHM}-hash ...`)

			const hash = await getGunFSHash(file)
			const fsid = `${GUNFS_BASE}/${GUNFS_HASH_ALGORITHM}/${hash}`
			const { name, size, type } = file
			const created = Date.now()
			const headers = headers_ObjToResponse({
				name,
				hash,
				fsid,
				type,
				size,
				created,
			})
			console.log(`[${GUNFS_BASE}] store file to cache ${fsid}`, {
				name,
				size,
				type,
			})

			await gunfsCache.put(fsid, new Response(file, { headers }))
			return {
				name,
				size,
				type,
				hash,
				fsid,
				algorithm: GUNFS_HASH_ALGORITHM,
				created,
			}
		}

		ctx.opt.mesh.hear.gfs = async function (
			msg: GFSHearMessage,
			peer: GunPeer,
			/* root, */
		) {
			// console.warn(`[${GUNFS_BASE}] mesh.gfs`, msg, peer)
			const { find, found, pick } = msg
			const fsid = find || found || pick
			const fsidMatch = fsid && fsid.match(GUNFS_GET_MATCH)
			if (!fsidMatch)
				return console.error(`[${GUNFS_BASE}] invalid gfs message`, msg)
			const short = fsidMatch[1].substr(0, 8)

			if (find) {
				const cacheMatch = await gunfsCache.match(find)
				if (!cacheMatch)
					return console.debug(`[${GUNFS_BASE}] !cacheMatch for ${short}`)

				console.warn(`[${GUNFS_BASE}] offering "${short}"`, peer)
				ctx.opt.mesh.say({ dam: "gfs", found: find })
			} else if (found && finding[found]) {
				console.warn(
					`[${GUNFS_BASE}] a peer offered a file we're looking for`,
					peer,
				)
				if (!peer.ondatachannel)
					return console.warn(
						`[${GUNFS_BASE}] missing peer.ondatachannel`,
						peer,
					)

				if (!picking[found]) {
					picking[found] = peer
					ctx.opt.mesh.say({ dam: "gfs", pick: found }, peer)
				} else {
					return console.warn(
						`[${GUNFS_BASE}] thanks but no thanks, ${peer.id}`,
						peer,
					)
				}

				peer.ondatachannel.gfs =
					peer.ondatachannel.gfs ||
					function (event: GunDatachannelEvent) {
						console.warn(`[${GUNFS_BASE}] ondatachannel, ${peer.id}`, event)

						let channel = event.channel
						let receivedBuffers: any = []
						// let receivedBuffers: ArrayBuffer = new ArrayBuffer(0)
						let headers: any
						channel.binaryType = "arraybuffer"

						channel.onopen = function (event: GunChannelOpenEvent) {
							console.log(`[${short}:finding].onopen`, event)
							// channel.send("Ready when you are")
						}
						channel.onmessage = async function (event: GunChannelMessageEvent) {
							console.log(`[${short}:finding].onmessage`, event.data)
							const { data } = event
							try {
								if (data[0] === "{") {
									headers = JSON.parse(data)
									console.log(`headers`, headers)
								} else if (data !== GUNFS_EOF) {
									console.log(
										`[${short}:finding].onmessage`,
										receivedBuffers.length,
									)
									receivedBuffers.push(data)
								} else {
									const arrayBuffer = receivedBuffers.reduce(
										(acc: Uint8Array, arrayBuffer:any) => {
											const tmp = new Uint8Array(
												acc.byteLength + arrayBuffer.byteLength,
											)
											tmp.set(new Uint8Array(acc), 0)
											tmp.set(new Uint8Array(arrayBuffer), acc.byteLength)
											return tmp
										},
										new Uint8Array(),
									)
									const blob = new Blob([arrayBuffer])
									const fileResponse = new Response(blob, { headers })
									gunfsCache.put(fsid, fileResponse)
									// const blob = await fileResponse.blob()
									// downloadFile(blob, channel.label + '.txt')
									channel.close()
									finding[found](blob)
									delete finding[found]
									delete picking[found]
								}
							} catch (err) {
								console.log("File transfer failed")
							}
						}
						channel.onclose = function () {
							console.log(`[${short}:finding].onclose`)
						}
					}
			} else if (pick) {
				console.log(`[${short}:pick] we got picked to deliver a file`)

				const cacheResponse = await gunfsCache.match(pick)
				if (!cacheResponse)
					return console.warn(`[${GUNFS_BASE}] !cacheResponse for ${short}`)
				const fileChannel = peer.createDataChannel("gfs")
				fileChannel.binaryType = "arraybuffer"

				fileChannel.onopen = async (/* event */) => {
					const cacheHeaders = cacheResponse.headers
					// console.log(`cacheResponse`, cacheResponse)
					// const created = headers.get(`X-GFS-CREATED`)
					const headers = headers_ResponseToObj(cacheResponse)
					fileChannel.send(JSON.stringify(headers))

					const blob = await cacheResponse.blob()
					const arrayBuffer = await blob.arrayBuffer()
					const arrayBufferLength = arrayBuffer.byteLength
					for (let i = 0; i < arrayBufferLength; i += GUNFS_MAX_SLICE_SIZE) {
						console.log(
							`[${short}:pick] delivering the file [${i}/${arrayBufferLength}]`,
						)
						fileChannel.send(arrayBuffer.slice(i, i + GUNFS_MAX_SLICE_SIZE))
					}
					fileChannel.send(GUNFS_EOF)

					// fileChannel.send("here we go")
					// setTimeout(() => {
					// 	fileChannel.close()
					// }, 1000)
				}
			}
		}
		//- ctx.on('out', async function (msg) {
		//- 	console.log(`ctx:out`, this)
		//- 	const to = this.to
		//- 	const fsid = msg && msg.get && msg.get['#']
		//- 	const via = msg && msg._ && msg._.via
		//- 	console.log(to, fsid, via)
		//- })
		// Check all incoming traffic
	})
}


export async function getGunFSHash(blob:Blob) {
	// convert your Blob to an ArrayBuffer
	// could also use a FileRedaer for this for browsers that don't support Response API
	const buf = await new Response(blob).arrayBuffer()
	const hash = await crypto.subtle.digest(GUNFS_HASH_ALGORITHM, buf)
	console.log(`hash`, hash)
	let result = ""
	const view = new DataView(hash)
	for (let i = 0; i < hash.byteLength; i += 4) {
		result += view.getUint32(i).toString(16).padStart(2, "0")
	}
	return result
}

export function headers_ResponseToObj(response: Response) {
	return {
		"name": response.headers.get("X-GFS-NAME"),
		"hash": response.headers.get("X-GFS-HASH"),
		"fsid": response.headers.get("X-GFS-FSID"),
		"type": response.headers.get("X-GFS-TYPE"),
		"size": parseInt(response.headers.get("X-GFS-SIZE") || "0"),
		"created": parseInt(response.headers.get("X-GFS-CREATED") || "0"),
		// "Content-Type": response.headers.get("X-GFS-TYPE"),
		// "Content-Length": parseInt(response.headers.get("X-GFS-SIZE") || "0"),
	}
}
export function headers_ObjToResponse(entry: GFSEntryInfo): GFSEntryHeaders {
	return {
		"X-GFS-NAME": entry.name,
		"X-GFS-HASH": entry.hash,
		"X-GFS-FSID": entry.fsid,
		"X-GFS-TYPE": entry.type,
		"X-GFS-SIZE": entry.size.toString(),
		"X-GFS-CREATED": entry.created.toString(),
		"X-GFS-ALGORITHM": GUNFS_HASH_ALGORITHM,
		"Content-Type": entry.type,
		"Content-Length": entry.size.toString(),
	}
}

export const downloadFile = (blob:Blob, fileName:string) => {
	const a = document.createElement("a")
	const url = window.URL.createObjectURL(blob)
	a.href = url
	a.download = fileName
	a.click()
	window.URL.revokeObjectURL(url)
	a.remove()
}