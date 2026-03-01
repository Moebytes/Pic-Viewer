/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import CheckboxIcon from "../assets/svg/checkbox.svg"
import CheckboxCheckedIcon from "../assets/svg/checkbox-checked.svg"
import "./styles/dialog.less"

const GIFDialog: React.FunctionComponent = (prps) => {
    const [speed, setSpeed] = useState(1)
    const [reverse, setReverse] = useState(false)
    const [transparency, setTransparency] = useState(false)
    const [transparentColor, setTransparentColor] = useState("#000000")
    const [hover, setHover] = useState(false)
    const [clickCounter, setClickCounter] = useState(2)

    useEffect(() => {
        window.ipcRenderer.invoke("get-gif-options").then((options) => {
            setTransparency(options.transparency)
            setTransparentColor(options.transparentColor)
        })
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparent = await window.ipcRenderer.invoke("get-transparent")
            functions.updateTheme(theme, transparent)
            window.ipcRenderer.invoke("ready-to-show")
        }
        initTheme()
        const savedValues = async () => {
            const savedSpeed = await window.ipcRenderer.invoke("get-temp", "speed")
            const savedReverse = await window.ipcRenderer.invoke("get-temp", "reverse")
            const savedTransparency = await window.ipcRenderer.invoke("get-temp", "transparency")
            const savedTransparentColor = await window.ipcRenderer.invoke("get-temp", "transparentColor")
            if (savedSpeed) setSpeed(Number(savedSpeed))
            if (savedReverse) setReverse(savedReverse === "true")
            if (savedTransparency) setTransparency(savedTransparency === "true")
            if (savedTransparentColor) setTransparentColor(savedTransparentColor)
        }
        savedValues()
        const updateTheme = (event: any, theme: string, transparent: boolean) => {
            functions.updateTheme(theme, transparent)
        }
        const clickCounter = () => {
            setClickCounter((prev) => prev + 1)
        }
        document.addEventListener("click", clickCounter)
        window.ipcRenderer.on("update-theme", updateTheme)
        return () => {
            window.ipcRenderer.removeListener("update-theme", updateTheme)
            document.removeEventListener("click", clickCounter)
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

    const closeAndReset = () => {
        window.ipcRenderer.invoke("close-current-dialog")
        setSpeed(1)
        setReverse(false)
        setTransparency(false)
        setTransparentColor("#000000")
    }
    
    const close = () => {
        setTimeout(() => {
            if (!hover && clickCounter > 1) {
                window.ipcRenderer.invoke("set-gif-options", {speed, reverse, transparency, transparentColor})
                closeAndReset()
            }
        }, 100)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            window.ipcRenderer.invoke("gif-effects", {speed, reverse, transparency, transparentColor})
        }
        window.ipcRenderer.invoke("set-gif-options", {speed, reverse, transparency, transparentColor})
        window.ipcRenderer.invoke("save-temp", "speed", String(speed))
        window.ipcRenderer.invoke("save-temp", "reverse", String(reverse))
        window.ipcRenderer.invoke("save-temp", "transparency", String(transparency))
        window.ipcRenderer.invoke("save-temp", "transparentColor", String(transparentColor))
        closeAndReset()
    }

    const speedKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            let newSpeed = Number(speed) + 1
            setSpeed(newSpeed)
        } else if (event.key === "ArrowDown") {
            let newSpeed = Number(speed) - 1
            if (newSpeed < 0.1) newSpeed = 0.1
            setSpeed(newSpeed)
        }
    }

    return (
        <section className="dialog" onMouseDown={close}>
            <div className="dialog-box" style={{width: "190px", height: "240px"}}
            onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="dialog-container">
                    <div className="dialog-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="dialog-title">GIF Options</p>
                    </div>
                    <div className="dialog-row-container">
                        <div className="dialog-row-start" style={{gap: "20px"}}>
                            <p className="dialog-text">Speed: </p>
                            <input className="dialog-input" type="text" spellCheck="false" onChange={(event) => setSpeed(Number(event.target.value))} value={speed} onKeyDown={speedKey}/>
                        </div>
                        <div className="dialog-row-start" style={{gap: "20px"}}>
                            <p className="dialog-text">Reverse: </p>
                            <div className="gif-checkbox-container">
                                {reverse ?
                                <CheckboxCheckedIcon className="gif-checkbox" onClick={() => setReverse((prev) => !prev)}/> : 
                                <CheckboxIcon className="gif-checkbox" onClick={() => setReverse((prev) => !prev)}/>}
                            </div>
                        </div>
                        <div className="dialog-row-start" style={{gap: "20px"}}>
                            <p className="dialog-text">Transparency: </p>
                            <div className="gif-checkbox-container">
                                {transparency ?
                                <CheckboxCheckedIcon className="gif-checkbox" onClick={() => setTransparency((prev) => !prev)}/> : 
                                <CheckboxIcon className="gif-checkbox" onClick={() => setTransparency((prev) => !prev)}/>}
                            </div>
                        </div>
                        <div className="dialog-row-start" style={{gap: "20px"}}>
                            <p className="dialog-text">Transparent Color: </p>   
                            <input type="color" className="gif-color-box" onChange={(event) => setTransparentColor(event.target.value)} onClick={() => setClickCounter(0)} value={transparentColor}></input>
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
root.render(<GIFDialog/>)