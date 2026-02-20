import Slider from "rc-slider"
import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/brightnessdialog.less"

const BrightnessDialog: React.FunctionComponent = (props) => {
    const initialState = {
        brightness: 1,
        contrast: 1
    }
    const [state, setState] = useState(initialState)
    const [hover, setHover] = useState(false)

    useEffect(() => {
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparency = await window.ipcRenderer.invoke("get-transparency")
            functions.updateTheme(theme, transparency)
        }
        initTheme()
        const savedValues = async () => {
            const savedBrightness = await window.ipcRenderer.invoke("get-temp", "brightness")
            const savedContrast = await window.ipcRenderer.invoke("get-temp", "contrast")
            if (savedBrightness) changeState("brightness", Number(savedBrightness))
            if (savedContrast) changeState("contrast", Number(savedContrast))
        }
        savedValues()
        const updateTheme = (event: any, theme: string, transparency: boolean) => {
            functions.updateTheme(theme, transparency)
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
    
    const changeState = (type: string, value: number) => {
        switch(type) {
            case "brightness":
                setState((prev) => {
                    return {...prev, brightness: value}
                })
                window.ipcRenderer.invoke("apply-brightness", {...state, brightness: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "brightness", String(value))
                break
            case "contrast":
                setState((prev) => {
                    return {...prev, contrast: value}
                })
                window.ipcRenderer.invoke("apply-brightness", {...state, contrast: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "contrast", String(value))
                break
        }
    }

    const closeAndReset = async (noRevert?: boolean) => {
        if (!noRevert) await window.ipcRenderer.invoke("revert-to-last-state")
        await window.ipcRenderer.invoke("close-current-dialog")
        setState(initialState)
    }
    
    const close = () => {
        setTimeout(() => {
            if (!hover) closeAndReset()
        }, 100)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            window.ipcRenderer.invoke("apply-brightness", state)
        }
        closeAndReset(button === "accept")
    }

    return (
        <section className="brightness-dialog" onMouseDown={close}>
            <div className="brightness-dialog-box" onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="brightness-container">
                    <div className="brightness-title-container">
                        <p className="brightness-title">Brightness and Contrast</p>
                    </div>
                    <div className="brightness-row-container">
                        <div className="brightness-row">
                            <p className="brightness-text">Brightness: </p>
                            <Slider className="brightness-slider" onChange={(value) => {changeState("brightness", value as number)}} min={0.5} max={1.5} step={0.1} value={state.brightness}/>
                        </div>
                        <div className="brightness-row">
                            <p className="brightness-text">Contrast: </p>
                            <Slider className="brightness-slider" onChange={(value) => {changeState("contrast", value as number)}} min={0.5} max={1.5} step={0.1} value={state.contrast}/>
                        </div>
                    </div>
                    <div className="brightness-button-container">
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