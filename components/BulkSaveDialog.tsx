import Draggable from "react-draggable"
import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/bulksavedialog.less"

const BulkSaveDialog: React.FunctionComponent = (props) => {
    const [hover, setHover] = useState(false)

    useEffect(() => {
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparency = await window.ipcRenderer.invoke("get-transparency")
            functions.updateTheme(theme, transparency)
        }
        initTheme()
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
        <section className="bulk-save-dialog" onMouseDown={close}>
            <Draggable handle=".bulk-save-title-container">
            <div className="bulk-save-dialog-box" onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="bulk-save-container">
                    <div className="bulk-save-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="bulk-save-title">Bulk Save</p>
                    </div>
                    <div className="bulk-save-row-container">
                        <div className="bulk-save-row">
                            <p className="bulk-save-text">Do you want to overwrite the original files?</p>
                        </div>
                    </div>
                    <div className="bulk-save-button-container">
                        <button onClick={() => click("reject")} className="reject-button">No</button>
                        <button onClick={() => click("accept")} className="accept-button">Yes</button>
                    </div>
                </div>
            </div>
            </Draggable>
        </section>
    )
}

const root = createRoot(document.getElementById("root")!)
root.render(<BulkSaveDialog/>)