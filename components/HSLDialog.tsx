import Slider from "rc-slider"
import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/dialog.less"

const HSLDialog: React.FunctionComponent = (props) => {
    const initialState = {
        hue: 0,
        saturation: 1,
        lightness: 0
    }
    const [state, setState] = useState(initialState)
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
            const savedHue = await window.ipcRenderer.invoke("get-temp", "hue")
            const savedSaturation = await window.ipcRenderer.invoke("get-temp", "saturation")
            const savedLightness = await window.ipcRenderer.invoke("get-temp", "lightness")
            if (savedHue) changeState("hue", Number(savedHue))
            if (savedSaturation) changeState("saturation", Number(savedSaturation))
            if (savedLightness) changeState("lightness", Number(savedLightness))
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

    const changeState = (type: string, value: number) => {
        switch(type) {
            case "hue":
                setState((prev) => {
                    return {...prev, hue: value}
                })
                window.ipcRenderer.invoke("apply-hsl", {...state, hue: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "hue", String(value))
                break
            case "saturation":
                setState((prev) => {
                    return {...prev, saturation: value}
                })
                window.ipcRenderer.invoke("apply-hsl", {...state, saturation: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "saturation", String(value))
                break
            case "lightness":
                setState((prev) => {
                    return {...prev, lightness: value}
                })
                window.ipcRenderer.invoke("apply-hsl", {...state, lightness: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "lightness", String(value))
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
            window.ipcRenderer.invoke("apply-hsl", state)
        }
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
                            <Slider className="dialog-slider" onChange={(value) => {changeState("hue", value as number)}} min={-180} max={180} step={1} value={state.hue}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Saturation: </p>
                            <Slider className="dialog-slider" onChange={(value) => {changeState("saturation", value as number)}} min={0.5} max={1.5} step={0.1} value={state.saturation}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Lightness: </p>
                            <Slider className="dialog-slider" onChange={(value) => {changeState("lightness", value as number)}} min={-100} max={100} step={1} value={state.lightness}/>
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