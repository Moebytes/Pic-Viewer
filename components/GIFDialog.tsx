import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import CheckboxIcon from "../assets/svg/checkbox.svg"
import CheckboxCheckedIcon from "../assets/svg/checkbox-checked.svg"
import "./styles/dialog.less"

const GIFDialog: React.FunctionComponent = (props) => {
    const initialState = {
        speed: 1,
        reverse: false,
        transparency: false,
        transparentColor: "#000000"
    }
    const [state, setState] = useState(initialState)
    const [hover, setHover] = useState(false)
    const [clickCounter, setClickCounter] = useState(2)

    useEffect(() => {
        window.ipcRenderer.invoke("get-gif-options").then((options) => {
            setState((prev) => {
                return {...prev, transparency: options.transparency, transparentColor: options.transparentColor}
            })
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
            if (savedSpeed) changeState("speed", Number(savedSpeed))
            if (savedReverse) changeState("reverse", savedReverse === "true")
            if (savedTransparency) changeState("transparency", savedTransparency === "true")
            if (savedTransparentColor) changeState("transparentColor", savedTransparentColor)
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

    const changeState = (type: string, value: any) => {
        switch(type) {
            case "speed":
                setState((prev) => {
                    return {...prev, speed: value}
                })
                window.ipcRenderer.invoke("save-temp", "speed", String(value))
                break
            case "reverse":
                setState((prev) => {
                    return {...prev, reverse: value}
                })
                window.ipcRenderer.invoke("save-temp", "reverse", String(value))
                break
            case "transparency":
                setState((prev) => {
                    return {...prev, transparency: value}
                })
                window.ipcRenderer.invoke("save-temp", "transparency", String(value))
                break
            case "transparentColor":
                setState((prev) => {
                    return {...prev, transparentColor: value}
                })
                window.ipcRenderer.invoke("save-temp", "transparentColor", String(value))
                break
        }
    }

    const closeAndReset = () => {
        window.ipcRenderer.invoke("close-current-dialog")
        setState(initialState)
    }
    
    const close = () => {
        setTimeout(() => {
            if (!hover && clickCounter > 1) {
                window.ipcRenderer.invoke("set-gif-options", state)
                closeAndReset()
            }
        }, 100)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            window.ipcRenderer.invoke("gif-effects", state)
        }
        window.ipcRenderer.invoke("set-gif-options", state)
        closeAndReset()
    }

    const speedKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            let speed = Number(state.speed) + 1
            changeState("speed", speed)
        } else if (event.key === "ArrowDown") {
            let speed = Number(state.speed) - 1
            if (speed < 0.1) speed = 0.1
            changeState("speed", speed)
        }
    }

    return (
        <section className="dialog" onMouseDown={close}>
            <div className="dialog-box" style={{width: "190px", height: "175px"}}
            onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="dialog-container">
                    <div className="dialog-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="dialog-title">GIF Options</p>
                    </div>
                    <div className="dialog-row-container">
                        <div className="dialog-row">
                            <p className="dialog-text">Speed: </p>
                            <input className="dialog-input" type="text" spellCheck="false" onChange={(event) => changeState("speed", event.target.value)} value={state.speed} onKeyDown={speedKey}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Reverse: </p>
                            <div className="gif-checkbox-container">
                                {state.reverse ?
                                <CheckboxCheckedIcon className="gif-checkbox" onClick={() => changeState("reverse", !state.reverse)}/> : 
                                <CheckboxIcon className="gif-checkbox" onClick={() => changeState("reverse", !state.reverse)}/>}
                            </div>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Transparency: </p>
                            <div className="gif-checkbox-container">
                                {state.transparency ?
                                <CheckboxCheckedIcon className="gif-checkbox" onClick={() => changeState("transparency", !state.transparency)}/> : 
                                <CheckboxIcon className="gif-checkbox" onClick={() => changeState("transparency", !state.transparency)}/>}
                            </div>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Transparent Color: </p>   
                            <input type="color" className="gif-color-box" onChange={(event) => changeState("transparentColor", event.target.value)} onClick={() => setClickCounter(0)} value={state.transparentColor}></input>
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