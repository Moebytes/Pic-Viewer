import Slider from "rc-slider"
import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import DownArrowIcon from "../assets/svg/down-arrow.svg"
import UpArrowIcon from "../assets/svg/up-arrow.svg"
import LeftArrowIcon from "../assets/svg/left-arrow.svg"
import RightArrowIcon from "../assets/svg/right-arrow.svg"
import "./styles/dialog.less"

const RotateDialog: React.FunctionComponent = () => {
    const initialState = {
        degrees: 0
    }
    const [state, setState] = useState(initialState)
    const [hover, setHover] = useState(false)
    const [downHover, setDownHover] = useState(false)
    const [upHover, setUpHover] = useState(false)
    const [leftHover, setLeftHover] = useState(false)
    const [rightHover, setRightHover] = useState(false)

    useEffect(() => {
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparent = await window.ipcRenderer.invoke("get-transparent")
            functions.updateTheme(theme, transparent)
            window.ipcRenderer.invoke("ready-to-show")
        }
        initTheme()
        const savedValues = async () => {
            const savedRotation = await window.ipcRenderer.invoke("get-temp", "rotation")
            if (savedRotation) changeState("degrees", Number(savedRotation))
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
            case "degrees":
                setState((prev) => {
                    return {...prev, degrees: value}
                })
                window.ipcRenderer.invoke("apply-rotate", {...state, degrees: value, realTime: true})
                window.ipcRenderer.invoke("get-temp", "rotation", String(value))
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
            window.ipcRenderer.invoke("apply-rotate", state)
        }
        closeAndReset(button === "accept")
    }

    const degreeKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            let degrees = state.degrees + 1
            if (degrees > 180) degrees = -180
            changeState("degrees", degrees)
        } else if (event.key === "ArrowDown") {
            let degrees = state.degrees - 1
            if (degrees < -180) degrees = 180
            changeState("degrees", degrees)
        }
    }

    return (
        <section className="dialog" onMouseDown={close}>
            <div className="dialog-box" style={{width: "230px", height: "170px"}}
            onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="dialog-container" style={{gap: "2px"}}>
                    <div className="dialog-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="dialog-title">Rotate</p>
                    </div>
                    <div className="dialog-row-container">
                        <div className="dialog-row">
                            <p className="dialog-text">Degrees: </p>
                            <input className="dialog-input" type="text" spellCheck="false" onChange={(event) => changeState("degrees", Number(event.target.value))} value={state.degrees} onKeyDown={degreeKey}/>
                        </div>
                        <div className="dialog-row">
                            <Slider className="dialog-slider" onChange={(value) => {changeState("degrees", value as number)}} min={-180} max={180} step={1} value={state.degrees}/>
                        </div>
                    </div>
                    <div className="rotate-arrow-container">
                        <LeftArrowIcon className="rotate-arrow" onClick={() => changeState("degrees", -90)}/>
                        <DownArrowIcon className="rotate-arrow" onClick={() => changeState("degrees", 180)}/>
                        <UpArrowIcon className="rotate-arrow" onClick={() => changeState("degrees", 0)}/>
                        <RightArrowIcon className="rotate-arrow" onClick={() => changeState("degrees", 90)}/>
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
root.render(<RotateDialog/>)