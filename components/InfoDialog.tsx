import React, {useEffect, useState} from "react"
import {useActiveSelector, useActiveActions} from "../store"
import functions from "../structures/functions"
import "./styles/dialog.less"

const InfoDialog: React.FunctionComponent = () => {
    const {infoDialogActive} = useActiveSelector()
    const {setHover: setHoverCtx, setInfoDialogActive} = useActiveActions()
    const initialState = {
        name: null,
        width: 0,
        height: 0,
        format: null,
        size: 0 as any,
        dpi: 0,
        frames: 0,
        space: null
    }
    const [state, setState] = useState(initialState)
    const [hover, setHover] = useState(false)

    useEffect(() => {
        const showinfoDialog = async (event: any, coords: {x: number, y: number}) => {
            const info = await window.ipcRenderer.invoke("get-metadata")
            if (info.length > 1) {
                const image = functions.imageAtCursor(coords)
                const i = info.findIndex((i: any) => functions.pathEqual(i.image, image))
                if (i === -1) return close()
                setState((prev) => {
                    return {...prev, name: info[i].name, width: info[i].width, height: info[i].height, format: info[i].format, 
                    size: info[i].size, dpi: info[i].dpi, frames: info[i].frames, space: info[i].space}
                })
            } else {
                setState((prev) => {
                    return {...prev, name: info[0].name, width: info[0].width, height: info[0].height, format: info[0].format, 
                    size: info[0].size, dpi: info[0].dpi, frames: info[0].frames, space: info[0].space}
                })
            }
            setInfoDialogActive(true)
            
        }
        const closeAllDialogs = (event: any, ignore: any) => {
            if (ignore !== "info") close()
        }
        window.ipcRenderer.on("show-info-dialog", showinfoDialog)
        window.ipcRenderer.on("close-all-dialogs", closeAllDialogs)
        return () => {
            window.ipcRenderer.removeListener("show-info-dialog", showinfoDialog)
            window.ipcRenderer.removeListener("close-all-dialogs", closeAllDialogs)
        }
    }, [])

    const close = () => {
        if (!hover) {
            setInfoDialogActive(false)
            setState(initialState)
        }
    }

    if (infoDialogActive) {
        return (
            <section className="dialog" style={{pointerEvents: "auto"}} onMouseDown={close} onMouseEnter={() => setHoverCtx(false)} onMouseLeave={() => setHoverCtx(true)}>
                <div className="dialog-box" style={{position: "relative", width: "max-content", height: "max-content"}} onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <p className="dialog-title">Image Info</p>
                        </div>
                        <div className="dialog-row-container">
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Name: </p>
                                <p className="dialog-text-alt">{state.name}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Width: </p>
                                <p className="dialog-text-alt">{state.width}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Height: </p>
                                <p className="dialog-text-alt">{state.height}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">DPI: </p>
                                <p className="dialog-text-alt">{state.dpi}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Size: </p>
                                <p className="dialog-text-alt">{state.size === "?" ? "?" : functions.readableFileSize(state.size)}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Format: </p>
                                <p className="dialog-text-alt">{state.format}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Frames: </p>
                                <p className="dialog-text-alt">{state.frames}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Color Space: </p>
                                <p className="dialog-text-alt">{state.space}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }
    return null
}

export default InfoDialog