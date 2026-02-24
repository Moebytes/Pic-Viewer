import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/dialog.less"

const BulkSaveDialog: React.FunctionComponent = (props) => {
    const [hover, setHover] = useState(false)

    useEffect(() => {
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparent = await window.ipcRenderer.invoke("get-transparent")
            functions.updateTheme(theme, transparent)
            window.ipcRenderer.invoke("ready-to-show")
        }
        initTheme()
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

    const closeAndReset = async () => {
        await window.ipcRenderer.invoke("close-current-dialog")
    }
    
    const close = () => {
        setTimeout(() => {
            if (!hover) closeAndReset()
        }, 100)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            window.ipcRenderer.invoke("bulk-save-overwrite")
        } else {
            window.ipcRenderer.invoke("bulk-save-directory")
        }
        closeAndReset()
    }

    return (
        <section className="dialog" onMouseDown={close}>
            <div className="dialog-box" style={{width: "230px", height: "170px"}}
            onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="dialog-container">
                    <div className="dialog-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="dialog-title">Bulk Save</p>
                    </div>
                    <div className="dialog-row-container">
                        <div className="dialog-row">
                            <p className="dialog-mini-text">Do you want to overwrite the original files?</p>
                        </div>
                    </div>
                    <div className="dialog-button-container">
                        <button onClick={() => click("reject")} className="reject-button">No</button>
                        <button onClick={() => click("accept")} className="accept-button">Yes</button>
                    </div>
                </div>
            </div>
        </section>
    )
}

const root = createRoot(document.getElementById("root")!)
root.render(<BulkSaveDialog/>)