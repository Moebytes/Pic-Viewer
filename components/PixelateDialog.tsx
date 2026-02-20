import Slider from "rc-slider"
import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/pixelatedialog.less"

const PixelateDialog: React.FunctionComponent = (props) => {
    const initialState = {
        strength: 1
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
            const savedPixelate = await window.ipcRenderer.invoke("get-temp", "pixelate")
            if (savedPixelate) changeState("strength", Number(savedPixelate))
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
            case "strength":
                setState((prev) => {
                    return {...prev, strength: value}
                })
                window.ipcRenderer.invoke("apply-pixelate", {...state, strength: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "pixelate", String(value))
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
            window.ipcRenderer.invoke("apply-pixelate", state)
        }
        closeAndReset(button === "accept")
    }

    return (
        <section className="pixelate-dialog" onMouseDown={close}>
            <div className="pixelate-dialog-box" onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="pixelate-container">
                    <div className="pixelate-title-container">
                        <p className="pixelate-title">Pixelate</p>
                    </div>
                    <div className="pixelate-row-container">
                        <div className="pixelate-row">
                            <p className="pixelate-text">Strength: </p>
                            <Slider className="pixelate-slider" onChange={(value) => {changeState("strength", value as number)}} min={1} max={50} step={1} value={state.strength}/>
                        </div>
                    </div>
                    <div className="pixelate-button-container">
                        <button onClick={() => click("reject")} className="reject-button">{"Cancel"}</button>
                        <button onClick={() => click("accept")} className="accept-button">{"Ok"}</button>
                    </div>
                </div>
            </div>
        </section>
    )
}

const root = createRoot(document.getElementById("root")!)
root.render(<PixelateDialog/>)