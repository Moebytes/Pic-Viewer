import Slider from "rc-slider"
import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/binarizedialog.less"

const BinarizeDialog: React.FunctionComponent = () => {
    const initialState = {
        binarize: 128
    }
    const [state, setState] = useState(initialState)
    const [hover, setHover] = useState(false)

    useEffect(() => {
        setTimeout(() => {window.ipcRenderer.invoke("apply-binarize", {...state, realTime: true})}, 100)
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparency = await window.ipcRenderer.invoke("get-transparency")
            functions.updateTheme(theme, transparency)
        }
        initTheme()
        const savedValues = async () => {
            const savedBinarize = await window.ipcRenderer.invoke("get-temp", "binarize")
            if (savedBinarize) changeState("binarize", Number(savedBinarize))
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
            case "binarize":
                setState((prev) => {
                    return {...prev, binarize: value}
                })
                window.ipcRenderer.invoke("apply-binarize", {...state, binarize: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "binarize", String(value))
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
            window.ipcRenderer.invoke("apply-binarize", state)
        }
        closeAndReset(button === "accept")
    }

    return (
        <section className="binarize-dialog" onMouseDown={close}>
            <div className="binarize-dialog-box" onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="binarize-container">
                    <div className="binarize-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="binarize-title">Binarize</p>
                    </div>
                    <div className="binarize-row-container">
                        <div className="binarize-row">
                            <p className="binarize-text">Threshold: </p>
                            <Slider className="binarize-slider" onChange={(value) => {changeState("binarize", value as number)}} min={1} max={255} step={1} value={state.binarize}/>
                        </div>
                    </div>
                    <div className="binarize-button-container">
                        <button onClick={() => click("reject")} className="reject-button">{"Cancel"}</button>
                        <button onClick={() => click("accept")} className="accept-button">{"Ok"}</button>
                    </div>
                </div>
            </div>
        </section>
    )
}

const root = createRoot(document.getElementById("root")!)
root.render(<BinarizeDialog/>)