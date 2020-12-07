import React from "react"
import { createContext } from "react"
import Gun from "gun/gun"
import "gun/lib/webrtc"
import { registerGunFS } from "./gunfs"
// @ts-ignore
// window.gunfs = gunfs
// gunfs()
registerGunFS(Gun)
// installSW()

export const GunContext = createContext<any>(null)
export const GunContextProvider = ({ children }:any) => {
	// const gun = Gun()
	// @ts-ignore
	// window.gun = gun
	// @ts-ignore
	window.Gun = Gun

	return <GunContext.Provider value={{Gun}}>{children}</GunContext.Provider>
}