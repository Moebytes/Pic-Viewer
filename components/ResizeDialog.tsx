/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import ChainIcon from "../assets/svg/chain.svg"
import ChainTopIcon from "../assets/svg/chain-top.svg"
import ChainBottomIcon from "../assets/svg/chain-bottom.svg"
import "./styles/dialog.less"

const ResizeDialog: React.FunctionComponent = () => {
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [originalWidth, setOriginalWidth] = useState(0)
    const [originalHeight, setOriginalHeight] = useState(0)
    const [link, setLink] = useState(true)
    const [percent, setPercent] = useState(false)
    const [hover, setHover] = useState(false)

    useEffect(() => {
        window.ipcRenderer.invoke("get-metadata").then((metadata: any) => {
            if (metadata.length > 1) {
                setWidth(100)
                setHeight(100)
                setOriginalWidth(100)
                setOriginalHeight(100)
                setPercent(true)
            } else {
                setWidth(metadata[0].width)
                setHeight(metadata[0].height)
                setOriginalWidth(metadata[0].width)
                setOriginalHeight(metadata[0].height)
            }
        })
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparent = await window.ipcRenderer.invoke("get-transparent")
            functions.updateTheme(theme, transparent)
            window.ipcRenderer.invoke("ready-to-show")
        }
        initTheme()
        const savedValues = async () => {
            const savedResize = await window.ipcRenderer.invoke("get-temp", "resize")
            if (savedResize) {
                const json = JSON.parse(savedResize)
                setWidth(Number(json.width))
                setHeight(Number(json.height))
                setPercent(json.percent === "true")
            }
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
        window.ipcRenderer.invoke("resize", {width, height, percent, realTime: true})
    }, [width, height, percent])

    const closeAndReset = async (noRevert?: boolean) => {
        if (!noRevert) await window.ipcRenderer.invoke("revert-to-last-state")
        await window.ipcRenderer.invoke("close-current-dialog")
        setWidth(0)
        setHeight(0)
        setOriginalWidth(0)
        setOriginalHeight(0)
        setLink(true)
        setPercent(false)
    }
    
    const close = () => {
        setTimeout(() => {
            if (!hover) closeAndReset()
        }, 100)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
                window.ipcRenderer.invoke("apply-resize", {width, height, percent})
        }
        window.ipcRenderer.invoke("save-temp", "resize", JSON.stringify({width, height, percent}))
        closeAndReset(button === "accept")
    }

    const changeWidth = (value?: number | string, newLink?: boolean) => {
        const newWidth = value !== undefined ? Number(value) : width
        if (Number.isNaN(Number(newWidth))) return
        let newHeight = height
        const isLinked = newLink !== undefined ? newLink : link
        if (isLinked) {
            const ratio = (Number(newWidth) / originalWidth)
            newHeight = Math.round(Number(originalHeight) * ratio)
        }
        setWidth(newWidth)
        setHeight(newHeight)
    }

    const changeHeight = (value?: number | string, newLink?: boolean) => {
        const newHeight = value !== undefined ? Number(value) : height
        if (Number.isNaN(Number(height))) return
        const isLinked = newLink !== undefined ? newLink : link
        if (isLinked) {
            return
        } else {
            const newWidth = width
            setWidth(newWidth)
            setHeight(newHeight)
        }
    }

    const changeLink = () => {
        const newLink = !link
        setLink(newLink)
        changeWidth(undefined, newLink)
        changeHeight(undefined, newLink)
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
            <div className="dialog-box" style={{width: "230px", height: "150px"}}
            onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="dialog-container" style={{gap: "2px"}}>
                    <div className="dialog-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="dialog-title">Resize</p>
                    </div>
                    <div className="dialog-row-container" style={{gap: "7px"}}>
                        <div className="dialog-row" style={{justifyContent: "center"}}>
                            <p className="dialog-text">Width{percent ? " %" : ""}: </p>
                            <input className="dialog-input" type="text" spellCheck="false" 
                            onChange={(event) => changeWidth(event.target.value)} value={width} onKeyDown={widthKey}/>
                        </div>
                        <div className="dialog-row" style={{justifyContent: "center"}}>
                            <p className="dialog-text">Height{percent ? " %" : ""}: </p>
                            <input className="dialog-input" type="text" spellCheck="false" 
                            onChange={(event) => changeHeight(event.target.value)} value={height} onKeyDown={heightKey}/>
                        </div>
                        <div className="resize-chain-container">
                            <ChainTopIcon className="resize-chain-top" style={link ? {opacity: 1} : {opacity: 0}}/>
                            <ChainIcon className="resize-chain" onClick={changeLink}/>
                            <ChainBottomIcon className="resize-chain-bottom" style={link ? {opacity: 1} : {opacity: 0}}/>
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
root.render(<ResizeDialog/>)