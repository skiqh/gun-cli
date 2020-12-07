import React, { useState, useContext, useEffect } from "react"
import * as ReactDOM from "react-dom"
import Select from "react-select"
import Gun from "gun/gun"
import gql from "graphql-tag"
import graphqlGun from "graphql-gun"
import {lsGet, lsSet} from "./utils"

import "fontsource-raleway/latin-400-normal.css"
import "fontsource-raleway/latin-700-normal.css"
import "fontsource-share-tech-mono/latin.css"

import "./App.css"
import { GunContext, GunContextProvider } from "./contexts/Gun"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faCog } from "@fortawesome/free-solid-svg-icons"

type StartNode = {
	value: string
	label: string
}

const App = () => {
	const { Gun } = useContext(GunContext)
	const [GunInstance, setGunInstance] = useState<any>()
	const [PeerURLs, setPeerURLs] = useState<string>(`//${location.host}/gun`)
	const [Startnode, setStartnode] = useState<any>()
	const [Start, setStart] = useState<boolean>(false)
	const [Connecting, setConnecting] = useState<boolean>(false)
	const [Query, setQuery] = useState<string>(`{
 music {
  name
  bands[] {
   name
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
}`)
	const [Result, setResult] = useState<string>("")
	// const [StartNodes, setStartNodes] = useState<Array<StartNode>>([])

	const updateQuery = (evt: any) => setQuery(evt?.target?.value || "")
	const updatePeerURLs = (evt: any) => {
		const value = evt?.target?.value || ""
		setPeerURLs(value)
	}
	const selectStart = (evt:any) => {
		setQuery(`{
  ${PeerURLs} {
    ${Object.keys(Startnode)
      .filter((k) => k !== "_")
      .join("\n    ")}
  }
}`)
		setStart(true)
	}
	const connectPeers = async (usePeers) => {
		if(!PeerURLs && !usePeers)
			return
		setConnecting(true)
		try {
			const peers = Array.isArray(usePeers) ? usePeers : PeerURLs.split(/[, ]+/)
	
			for(let i=0;i<peers.length;i++) {
				const res = await fetch(peers[i])
				const text = await res.text()
				console.log(`res`, text)
			}
	
			console.log(`peers`, peers)
			let known_peers_lists = [peers, ...lsGet("known_peers_lists", [])].slice(
				0,
				5
			)

			const gun = Gun({peers})
			// @ts-ignore
			window.gun = gun
			setGunInstance(gun)

			lsSet("known_peers_lists", known_peers_lists)
		}
		catch(ex) {
			console.log(`ex`, ex)
		}
		finally {
			setConnecting(false)
		}
	}


	const refreshQuery = () => {
		if (Query === "") return
		try {
			const querySingles = gql`
				${Query.replace(/\[\]/g, "(type: Set)")}
			`
			console.log(`querySingles`, querySingles)

			const getResults = async () => {
				console.log(`getting query results...`)
				const result = await graphqlGun(querySingles, GunInstance)
				console.log(`result`, result)
				setResult(result)
			}
			getResults()
		} catch (gql_exception) {
			if (gql_exception.message.indexOf("Syntax Error: Unexpected Name") !== 0)
				console.log(`gql_exception`, gql_exception.message)
		}
	}
	const knownPeers = lsGet("known_peers_lists", [])
	
	// useEffect(refreshQuery, [Query])

	return (
		<div className="App">
			{!GunInstance && (
				<div className="wrapper center-wrapper">
					
					<div className="start-wrapper">
						<div className="start-input-wrapper">
							<div className="labeled-input" style={{ minWidth: "20rem" }}>
								<input
									type="text"
									name="PeerURLs"
									value={PeerURLs}
									onInput={updatePeerURLs}
									// placeholder="node-id-1"
								/>
								<label htmlFor="PeerURLs">Peers:</label>
							</div>
							<button onClick={connectPeers}>
								{!Connecting && <FontAwesomeIcon icon={faArrowRight} />}
								{Connecting && <FontAwesomeIcon icon={faCog} spin />}
							</button>
						</div>
						{!!knownPeers && (
							<div className="known-peers">
								{knownPeers.map((peers) => (
									<button onClick={() => connectPeers(peers)}>{peers.join('\n')}</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{GunInstance && (
				<div className="wrapper app-wrapper">
					{/* <svg className="viz"></svg> */}
					<pre>{JSON.stringify(Result, null, "  ")}</pre>
					<div className="sidebar">
						{/* <input type="text" /> */}
						<button onClick={refreshQuery}>UPD</button>
						{/* <Select options={StartNodes} isMulti /> */}
						<textarea
							className="query"
							value={Query}
							onInput={updateQuery}
						></textarea>
					</div>
				</div>
			)}
		</div>
	)
}

ReactDOM.render(
	<GunContextProvider>
		<App />
	</GunContextProvider>,
	document.getElementById("root")
)
