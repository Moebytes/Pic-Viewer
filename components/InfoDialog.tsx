import React, {useEffect, useState} from "react"
import {useActiveSelector, useActiveActions} from "../store"
import functions from "../structures/functions"
import "./styles/dialog.less"

const InfoDialog: React.FunctionComponent = () => {
    const {infoDialogActive} = useActiveSelector()
    const {setHover: setHoverCtx, setInfoDialogActive} = useActiveActions()
    const [name, setName] = useState(null)
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [format, setFormat] = useState(null)
    const [size, setSize] = useState(0)
    const [dpi, setDPI] = useState(0)
    const [frames, setFrames] = useState(0)
    const [space, setSpace] = useState(null)
    const [bitDepth, setBitDepth] = useState(0)
    const [progressive, setProgressive] = useState(false)
    const [alpha, setAlpha] = useState(false)
    const [hover, setHover] = useState(false)

    useEffect(() => {
        const showinfoDialog = async (event: any, coords: {x: number, y: number}) => {
            const info = await window.ipcRenderer.invoke("get-metadata")
            if (info.length > 1) {
                const image = functions.imageAtCursor(coords)
                const i = info.findIndex((i: any) => functions.pathEqual(i.image, image))
                if (i === -1) return close()
                setName(info[i].name)
                setWidth(info[i].width)
                setHeight(info[i].height)
                setFormat(info[i].format)
                setSize(info[i].size)
                setDPI(info[i].dpi)
                setFrames(info[i].frames)
                setSpace(info[i].space)
                setBitDepth(info[i].bitDepth)
                setProgressive(info[i].progressive)
                setAlpha(info[i].alpha)
            } else {
                setName(info[0].name)
                setWidth(info[0].width)
                setHeight(info[0].height)
                setFormat(info[0].format)
                setSize(info[0].size)
                setDPI(info[0].dpi)
                setFrames(info[0].frames)
                setSpace(info[0].space)
                setBitDepth(info[0].bitDepth)
                setProgressive(info[0].progressive)
                setAlpha(info[0].alpha)
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
            setName(null)
            setWidth(0)
            setHeight(0)
            setFormat(null)
            setSize(0)
            setDPI(0)
            setFrames(0)
            setSpace(null)
            setBitDepth(0)
            setProgressive(false)
            setAlpha(false)
        }
    }

    if (infoDialogActive) {
        return (
            <section className="dialog" style={{pointerEvents: "auto"}} onMouseDown={close} onMouseEnter={() => setHoverCtx(false)} 
            onMouseLeave={() => setHoverCtx(true)}>
                <div className="dialog-box" style={{position: "relative", width: "max-content", height: "max-content"}} 
                onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <p className="dialog-title">Image Info</p>
                        </div>
                        <div className="dialog-row-container">
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Name: </p>
                                <p className="dialog-text-alt">{name}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Width: </p>
                                <p className="dialog-text-alt">{width}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Height: </p>
                                <p className="dialog-text-alt">{height}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">DPI: </p>
                                <p className="dialog-text-alt">{dpi}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Bit Depth: </p>
                                <p className="dialog-text-alt">{bitDepth ?? "?"}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Size: </p>
                                <p className="dialog-text-alt">{String(size) === "?" ? "?" : functions.readableFileSize(size)}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Format: </p>
                                <p className="dialog-text-alt">{format}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Progressive: </p>
                                <p className="dialog-text-alt">{progressive ? "Yes" : "No"}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Alpha: </p>
                                <p className="dialog-text-alt">{alpha ? "Yes" : "No"}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Frames: </p>
                                <p className="dialog-text-alt">{frames}</p>
                            </div>
                            <div className="dialog-row-start">
                                <p className="dialog-text-big">Color Space: </p>
                                <p className="dialog-text-alt">{space}</p>
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