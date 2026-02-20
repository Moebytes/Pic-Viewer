import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/tintdialog.less"

const TintDialog: React.FunctionComponent = () => {
    const initialState = {
        tint: "#ffffff"
    }
    const [state, setState] = useState(initialState)
    const [hover, setHover] = useState(false)
    const [clickCounter, setClickCounter] = useState(2)

    useEffect(() => {
        setTimeout(() => {window.ipcRenderer.invoke("apply-tint", {...state, realTime: true})}, 100)
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparency = await window.ipcRenderer.invoke("get-transparency")
            functions.updateTheme(theme, transparency)
        }
        initTheme()
        const savedValues = async () => {
            const savedTint = await window.ipcRenderer.invoke("get-temp", "tint")
            if (savedTint) changeState("tint", Number(savedTint))
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

    const changeState = (type: string, value: any) => {
        switch(type) {
            case "tint":
                setState((prev) => {
                    return {...prev, tint: value}
                })
                window.ipcRenderer.invoke("apply-tint", {...state, tint: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "tint", String(value))
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
            if (!hover && clickCounter > 1) closeAndReset()
        }, 100)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            window.ipcRenderer.invoke("apply-tint", state)
        }
        closeAndReset(button === "accept")
    }

    return (
        <section className="tint-dialog" onMouseDown={close}>
            <div className="tint-dialog-box" onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="tint-container">
                    <div className="tint-title-container">
                        <p className="tint-title">Tint</p>
                    </div>
                    <div className="tint-row-container">
                        <div className="tint-row">
                            <p className="tint-text">Color: </p>
                            <input onChange={(event) => changeState("tint", event.target.value)} onClick={() => setClickCounter(0)} type="color" className="tint-color-box" value={state.tint}></input>
                        </div>
                    </div>
                    <div className="tint-button-container">
                        <button onClick={() => click("reject")} className="reject-button">{"Cancel"}</button>
                        <button onClick={() => click("accept")} className="accept-button">{"Ok"}</button>
                    </div>
                </div>
            </div>
        </section>
    )
}

const root = createRoot(document.getElementById("root")!)
root.render(<TintDialog/>)