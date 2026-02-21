import React, {useEffect, useState} from "react"
import {createRoot} from "react-dom/client"
import functions from "../structures/functions"
import ChainIcon from "../assets/svg/chain.svg"
import ChainTopIcon from "../assets/svg/chain-top.svg"
import ChainBottomIcon from "../assets/svg/chain-bottom.svg"
import "./styles/resizedialog.less"

const ResizeDialog: React.FunctionComponent = () => {
    const initialState = {
        width: 0,
        height: 0,
        originalWidth: 0,
        originalHeight: 0,
        link: true,
        percent: false
    }
    const [state, setState] = useState(initialState)
    const [hover, setHover] = useState(false)
    const [hoverChain, setHoverChain] = useState(false)

    useEffect(() => {
        window.ipcRenderer.invoke("get-metadata").then((metadata: any) => {
            if (metadata.length > 1) {
                setState((prev) => {
                    return {...prev, width: 100, height: 100, originalWidth: 100, originalHeight: 100, percent: true}
                })
            } else {
                setState((prev) => {
                    return {...prev, width: metadata[0].width, height: metadata[0].height, originalWidth: metadata[0].width, originalHeight: metadata[0].height}
                })
            }
        })
        const initTheme = async () => {
            const theme = await window.ipcRenderer.invoke("get-theme")
            const transparency = await window.ipcRenderer.invoke("get-transparency")
            functions.updateTheme(theme, transparency)
        }
        initTheme()
        const savedValues = async () => {
            const savedResize = await window.ipcRenderer.invoke("get-temp", "resize")
            if (savedResize) changeState("resize", JSON.parse(savedResize))
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

    const changeState = (type: string, newState: any) => {
        switch(type) {
            case "resize":
                setState((prev) => {
                    return {...prev, width: newState.width, height: newState.height}
                })
                window.ipcRenderer.invoke("apply-resize", {...state, width: newState.width, height: newState.height, percent: state.percent, realTime: true})
                window.ipcRenderer.invoke("save-temp", "resize", JSON.stringify(newState))
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
                window.ipcRenderer.invoke("apply-resize", state)
        }
        closeAndReset(button === "accept")
    }

    const changeWidth = (value?: number | string, newLink?: boolean) => {
        const width = value !== undefined ? Number(value) : state.width
        if (Number.isNaN(Number(width))) return
        let height = state.height
        const link = newLink !== undefined ? newLink : state.link
        if (link) {
            const ratio = (Number(width) / state.originalWidth)
            height = Math.round(Number(state.originalHeight) * ratio)
        }
        changeState("resize", {width, height})
    }

    const changeHeight = (value?: number | string, newLink?: boolean) => {
        const height = value !== undefined ? Number(value) : state.height
        if (Number.isNaN(Number(height))) return
        const link = newLink !== undefined ? newLink : state.link
        if (link) {
            return
        } else {
            const width = state.width
            changeState("resize", {width, height})
        }
    }

    const changeLink = () => {
        const newLink = !state.link
        setState((prev) => {
            return {...prev, link: newLink}
        })
        changeWidth(undefined, newLink)
        changeHeight(undefined, newLink)
    }

    const widthKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            changeWidth(state.width + 1)
        } else if (event.key === "ArrowDown") {
            if (state.width - 1 < 0) return
            changeWidth(state.width - 1)
        }
    }

    const heightKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp") {
            changeHeight(state.height + 1)
        } else if (event.key === "ArrowDown") {
            if (state.height - 1 < 0) return
            changeHeight(state.height - 1)
        }
    }

    return (
        <section className="resize-dialog" onMouseDown={close}>
            <div className="resize-dialog-box" onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <div className="resize-container">
                    <div className="resize-title-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                        <p className="resize-title">Resize</p>
                    </div>
                    <div className="resize-row-container">
                        <div className="resize-row">
                            <p className="resize-text">Width{state.percent ? " %" : ""}: </p>
                            <input className="resize-input" type="text" spellCheck="false" onChange={(event) => changeWidth(event.target.value)} value={state.width} onKeyDown={widthKey}/>
                        </div>
                        <div className="resize-row">
                            <p className="resize-text">Height{state.percent ? " %" : ""}: </p>
                            <input className="resize-input" type="text" spellCheck="false" onChange={(event) => changeHeight(event.target.value)} value={state.height} onKeyDown={heightKey}/>
                        </div>
                        <div className="resize-chain-container">
                            <ChainTopIcon className="resize-chain-top" style={state.link ? {opacity: 1} : {opacity: 0}}/>
                            <ChainIcon className="resize-chain" onClick={changeLink}/>
                            <ChainBottomIcon className="resize-chain-bottom" style={state.link ? {opacity: 1} : {opacity: 0}}/>
                        </div>
                    </div>
                    <div className="resize-button-container">
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