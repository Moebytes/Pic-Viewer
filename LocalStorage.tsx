import React, {useEffect} from "react"
import {ReduxState} from "./structures/functions"
import {useThemeSelector, useThemeActions, useActiveSelector, useActiveActions,
useFilterActions} from "./store"
import {Themes, OS} from "./reducers/themeReducer"

export const lightColorList = {
	"--closeButton": "#496dff",
	"--minimizeButton": "#398bff",
	"--maximizeButton": "#2ea8ff",
	"--navColor": "#9abaff",
	"--iconColor": "#4a83ff",
	"--background": "#ffffff",
    "--textColor": "#000000",
    "--textColor2": "#000000",
	"--buttonColor": "#7e98ff"
}

export const darkColorList = {
	"--closeButton": "#496dff",
	"--minimizeButton": "#398bff",
	"--maximizeButton": "#2ea8ff",
	"--navColor": "#091329",
	"--iconColor": "#4c85ff",
	"--background": "#000000",
    "--textColor": "#ffffff",
    "--textColor2": "#000000",
	"--buttonColor": "#283d91"
}

const LocalStorage: React.FunctionComponent = () => {
    const {theme, os, transparent, pinned} = useThemeSelector()
    const {setTheme, setOS, setTransparent, setPinned} = useThemeActions()
    const {imageDrag} = useActiveSelector()
    const {setImageDrag} = useActiveActions()
    const {setBrightness, setContrast, setHue, setSaturation, 
    setLightness, setBlur, setSharpen, setPixelate} = useFilterActions()


    useEffect(() => {
        const syncState = (event: any, state: ReduxState) => {
            if (state.brightness !== undefined) setBrightness(state.brightness)
            if (state.contrast !== undefined) setContrast(state.contrast)
            if (state.hue !== undefined) setHue(state.hue)
            if (state.saturation !== undefined) setSaturation(state.saturation)
            if (state.lightness !== undefined) setLightness(state.lightness)
            if (state.blur !== undefined) setBlur(state.blur)
            if (state.sharpen !== undefined) setSharpen(state.sharpen)
            if (state.pixelate !== undefined) setPixelate(state.pixelate)
        }
        window.ipcRenderer.on("sync-redux-state", syncState)
        return () => {
            window.ipcRenderer.removeListener("sync-redux-state", syncState)
        }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        const colorList = theme.includes("light") ? lightColorList : darkColorList

        for (let i = 0; i < Object.keys(colorList).length; i++) {
            const key = Object.keys(colorList)[i]
            const color = Object.values(colorList)[i]
            document.documentElement.style.setProperty(key, color)
        }

        if (transparent) {
            document.documentElement.style.setProperty("--background", "transparent")
            document.documentElement.style.setProperty("--navColor", "transparent")
        }
    }, [theme, transparent])

    useEffect(() => {
        const initTheme = async () => {
            const savedTheme = await window.ipcRenderer.invoke("get-theme")
            if (savedTheme) setTheme(savedTheme as Themes)
        }
        initTheme()
    }, [])

    useEffect(() => {
        window.ipcRenderer.invoke("save-theme", theme)
    }, [theme])

    useEffect(() => {
        const initOS = async () => {
            const savedOS = await window.ipcRenderer.invoke("get-os")
            if (savedOS) setOS(savedOS as OS)
        }
        initOS()
    }, [])

    useEffect(() => {
        window.ipcRenderer.invoke("save-os", os)
    }, [os])

    useEffect(() => {
        const initTransparent = async () => {
            const savedTransparent = await window.ipcRenderer.invoke("get-transparent")
            if (savedTransparent) setTransparent(savedTransparent)
        }
        initTransparent()
    }, [])

    useEffect(() => {
        window.ipcRenderer.invoke("save-transparent", transparent)
    }, [transparent])

    useEffect(() => {
        const initPinned = async () => {
            const savedPinned = await window.ipcRenderer.invoke("get-pinned")
            if (savedPinned) setPinned(savedPinned)
        }
        initPinned()
    }, [])

    useEffect(() => {
        window.ipcRenderer.invoke("save-pinned", pinned)
    }, [pinned])

    useEffect(() => {
        const initImageDrag = async () => {
            const savedDrag = await window.ipcRenderer.invoke("get-img-drag")
            if (savedDrag) setImageDrag(Boolean(savedDrag))
        }
        initImageDrag()
    }, [])

    useEffect(() => {
        window.ipcRenderer.invoke("save-img-drag", imageDrag)
    }, [imageDrag])

    return null
}

export default LocalStorage