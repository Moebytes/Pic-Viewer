import Slider from "rc-slider"
import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/dialog.less"

const HSLDialog: React.FunctionComponent = () => {
    const [hue, setHue] = useState(180)
    const [saturation, setSaturation] = useState(100)
    const [lightness, setLightness] = useState(0)
    const [hover, setHover] = useState(false)

    useEffect(() => {
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparent = await window.ipcRenderer.invoke("get-transparent")
            functions.updateTheme(theme, transparent)
            window.ipcRenderer.invoke("ready-to-show")
        }
        initTheme()
        const savedValues = async () => {
            const savedLightness = await window.ipcRenderer.invoke("get-temp", "lightness")
            const savedHue = await window.ipcRenderer.invoke("get-temp", "hue")
            const savedSaturation = await window.ipcRenderer.invoke("get-temp", "saturation")
            if (savedHue) setHue(Number(savedHue))
            if (savedSaturation) setSaturation(Number(savedSaturation))
            if (savedLightness) setLightness(Number(savedLightness))
        }
        savedValues()
        const updateTheme = (event: any, theme: string, transparent: boolean) => {
            functions.updateTheme(theme, transparent)
        }
        window.ipcRenderer.on("update-theme", updateTheme)
        return () => {
            window.ipcRenderer.removeListener("update-theme", updateTheme)
        }
    }, [])

    useEffect(() => {
        const keyDown = async (event: globalThis.KeyboardEvent) => {
            if (event.key === "Enter") {
                enterPressed()
            }
            if (event.key === "Escape") {
                escapePressed()
            }
        }
        const enterPressed = () => {
            click("accept")
        }
        const escapePressed = () => {
            click("reject")
        }
        document.addEventListener("keydown", keyDown)
        window.ipcRenderer.on("enter-pressed", enterPressed)
        window.ipcRenderer.on("escape-pressed", escapePressed)
        return () => {
            document.removeEventListener("keydown", keyDown)
            window.ipcRenderer.removeListener("enter-pressed", enterPressed)
            window.ipcRenderer.removeListener("escape-pressed", escapePressed)
        }
    })

    useEffect(() => {
        window.ipcRenderer.send("sync-redux-state", {hue, saturation, lightness})
    }, [hue, saturation, lightness])

    useEffect(() => {
        window.ipcRenderer.invoke("hsl", {hue: 0, saturation: 1, lightness, realTime: true})
    }, [lightness])

    const closeAndReset = async (noRevert?: boolean) => {
        if (!noRevert) await window.ipcRenderer.invoke("revert-to-last-state")
        await window.ipcRenderer.invoke("close-current-dialog")
    }
    
    const close = () => {
        setTimeout(() => {
            if (!hover) closeAndReset()
        }, 100)
    }

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            window.ipcRenderer.invoke("apply-hsl", {hue, saturation, lightness})
        } else {  
            window.ipcRenderer.send("sync-redux-state", {hue: 180, saturation: 100, lightness: 0})
        }
        window.ipcRenderer.invoke("save-temp", "hue", String(hue))
        window.ipcRenderer.invoke("save-temp", "saturation", String(saturation))
        window.ipcRenderer.invoke("save-temp", "lightness", String(lightness))
        closeAndReset(button === "accept")
    }

    return (
        <section className="dialog" onMouseDown={close}>
            <div className="dialog-box" style={{width: "250px", height: "180px"}}
            onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="dialog-container">
                    <div className="dialog-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="dialog-title">HSL Adjustment</p>
                    </div>
                    <div className="dialog-row-container">
                        <div className="dialog-row">
                            <p className="dialog-text">Hue: </p>
                            <Slider className="dialog-slider" onChange={(value) => setHue(value as number)} min={0} max={360} step={1} value={hue}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Saturation: </p>
                            <Slider className="dialog-slider" onChange={(value) => setSaturation(value as number)} min={0} max={200} step={1} value={saturation}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Lightness: </p>
                            <Slider className="dialog-slider" onChange={(value) => setLightness(value as number)} min={-100} max={100} step={1} value={lightness}/>
                        </div>
                    </div>
                    <div className="dialog-button-container">
                        <button onClick={() => click("reject")} className="reject-button">{"Cancel"}</button>
                        <button onClick={() => click("accept")} className="accept-button">{"Ok"}</button>
                    </div>
                </div>
            </div>
        </section>
    )
}

const root = createRoot(document.getElementById("root")!)
root.render(<HSLDialog/>)