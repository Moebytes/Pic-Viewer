/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/dialog.less"

const CropDialog: React.FunctionComponent = () => {
    const [x, setX] = useState(0)
    const [y, setY] = useState(0)
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
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
            const savedX = await window.ipcRenderer.invoke("get-temp", "x")
            const savedY = await window.ipcRenderer.invoke("get-temp", "y")
            const savedWidth = await window.ipcRenderer.invoke("get-temp", "width")
            const savedHeight = await window.ipcRenderer.invoke("get-temp", "height")
            if (savedX) setX(Number(savedX))
            if (savedY) setY(Number(savedY))
            if (savedWidth) setWidth(Number(savedWidth))
            if (savedHeight) setHeight(Number(savedHeight))
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
        window.ipcRenderer.invoke("crop", {x, y, width, height, realTime: true})
    }, [x, y, width, height])

    const closeAndReset = async (noRevert?: boolean) => {
        if (!noRevert) await window.ipcRenderer.invoke("revert-to-last-state")
        await window.ipcRenderer.invoke("close-current-dialog")
        setX(0)
        setY(0)
        setWidth(0)
        setHeight(0)
    }
    
    const close = () => {
        setTimeout(() => {
            if (!hover) closeAndReset()
        }, 100)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
                window.ipcRenderer.invoke("apply-crop", {x, y, width, height})
        }
        window.ipcRenderer.invoke("save-temp", "x", String(x))
        window.ipcRenderer.invoke("save-temp", "y", String(y))
        window.ipcRenderer.invoke("save-temp", "width", String(width))
        window.ipcRenderer.invoke("save-temp", "height", String(height))
        closeAndReset(button === "accept")
    }

    const xKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            setX((prev) => prev + 1)
        } else if (event.key === "ArrowDown") {
            if (width - 1 < 0) return
            setX((prev) => prev - 1)
        }
    }

    const yKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            setY((prev) => prev + 1)
        } else if (event.key === "ArrowDown") {
            if (height - 1 < 0) return
            setY((prev) => prev - 1)
        }
    }

    const widthKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            setWidth((prev) => prev + 1)
        } else if (event.key === "ArrowDown") {
            if (width - 1 < 0) return
            setWidth((prev) => prev - 1)
        }
    }

    const heightKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            setHeight((prev) => prev + 1)
        } else if (event.key === "ArrowDown") {
            if (height - 1 < 0) return
            setHeight((prev) => prev - 1)
        }
    }

    return (
        <section className="dialog" onMouseDown={close}>
            <div className="dialog-box" style={{width: "190px", height: "220px"}}
            onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="dialog-container">
                    <div className="dialog-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="dialog-title">Bulk Crop</p>
                    </div>
                    <div className="dialog-row-container">
                        <div className="dialog-row">
                            <p className="dialog-text">X %: </p>
                            <input className="dialog-input" type="text" spellCheck="false" onChange={(event) => setX(Number(event.target.value))} value={x} onKeyDown={xKey}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Y %: </p>
                            <input className="dialog-input" type="text" spellCheck="false" onChange={(event) => setY(Number(event.target.value))} value={y} onKeyDown={yKey}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Width %: </p>
                            <input className="dialog-input" type="text" spellCheck="false" onChange={(event) => setWidth(Number(event.target.value))} value={width} onKeyDown={widthKey}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Height %: </p>
                            <input className="dialog-input" type="text" spellCheck="false" onChange={(event) => setHeight(Number(event.target.value))} value={height} onKeyDown={heightKey}/>
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
root.render(<CropDialog/>)