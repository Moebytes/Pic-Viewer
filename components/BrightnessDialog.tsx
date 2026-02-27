import Slider from "rc-slider"
import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/dialog.less"

const BrightnessDialog: React.FunctionComponent = () => {
    const [brightness, setBrightness] = useState(100)
    const [contrast, setContrast] = useState(100)
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
            const savedBrightness = await window.ipcRenderer.invoke("get-temp", "brightness")
            const savedContrast = await window.ipcRenderer.invoke("get-temp", "contrast")
            if (savedBrightness) setBrightness(Number(savedBrightness))
            if (savedContrast) setContrast(Number(savedContrast))
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
        window.ipcRenderer.send("sync-redux-state", {brightness, contrast})
    }, [brightness, contrast])


    const closeAndReset = async () => {
        await window.ipcRenderer.invoke("close-current-dialog")
    }
    
    const close = () => {
        setTimeout(() => {
            if (!hover) closeAndReset()
        }, 100)
    }

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            window.ipcRenderer.invoke("apply-brightness", {brightness, contrast})
        } else {  
            window.ipcRenderer.send("sync-redux-state", {brightness: 100, contrast: 100})
        }
        window.ipcRenderer.invoke("save-temp", "brightness", String(brightness))
        window.ipcRenderer.invoke("save-temp", "contrast", String(contrast))
        closeAndReset()
    }

    return (
        <section className="dialog" onMouseDown={close}>
            <div className="dialog-box" style={{width: "250px", height: "150px"}}
            onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="dialog-container">
                    <div className="dialog-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="dialog-title">Brightness and Contrast</p>
                    </div>
                    <div className="dialog-row-container">
                        <div className="dialog-row">
                            <p className="dialog-text">Brightness: </p>
                            <Slider className="dialog-slider" onChange={(value) => setBrightness(value as number)} min={5} max={200} step={1} value={brightness}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Contrast: </p>
                            <Slider className="dialog-slider" onChange={(value) => setContrast(value as number)} min={5} max={200} step={1} value={contrast}/>
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
root.render(<BrightnessDialog/>)