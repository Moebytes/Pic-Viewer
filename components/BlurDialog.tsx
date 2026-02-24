import Slider from "rc-slider"
import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import "./styles/dialog.less"

const BlurDialog: React.FunctionComponent = (props) => {
    const initialState = {
        blur: 0.3,
        sharpen: 0.3
    }
    const [state, setState] = useState(initialState)
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
            const savedBlur= await window.ipcRenderer.invoke("get-temp", "blur")
            const savedSharpen = await window.ipcRenderer.invoke("get-temp", "sharpen")
            if (savedBlur) changeState("blur", Number(savedBlur))
            if (savedSharpen) changeState("sharpen", Number(savedSharpen))
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
            case "blur":
                setState((prev) => {
                    return {...prev, blur: value}
                })
                window.ipcRenderer.invoke("apply-blur", {...state, blur: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "blur", String(value))
                break
            case "sharpen":
                setState((prev) => {
                    return {...prev, sharpen: value}
                })
                window.ipcRenderer.invoke("apply-blur", {...state, sharpen: value, realTime: true})
                window.ipcRenderer.invoke("save-temp", "sharpen", String(value))
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
            window.ipcRenderer.invoke("apply-blur", state)
        }
        closeAndReset(button === "accept")
    }

    return (
        <section className="dialog" onMouseDown={close}>
            <div className="dialog-box" style={{width: "250px", height: "155px"}}
            onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="dialog-container">
                    <div className="dialog-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="dialog-title">Blur and Sharpen</p>
                    </div>
                    <div className="dialog-row-container">
                        <div className="dialog-row">
                            <p className="dialog-text">Blur: </p>
                            <Slider className="dialog-slider" onChange={(value) => {changeState("blur", value as number)}} min={0.3} max={15} step={0.1} value={state.blur}/>
                        </div>
                        <div className="dialog-row">
                            <p className="dialog-text">Sharpen: </p>
                            <Slider className="dialog-slider" onChange={(value) => {changeState("sharpen", value as number)}} min={0.1} max={10} step={0.1} value={state.sharpen}/>
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
root.render(<BlurDialog/>)