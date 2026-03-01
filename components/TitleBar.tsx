/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {useActiveSelector, useDrawingSelector, useDrawingActions, 
useThemeSelector, useThemeActions,
useActiveActions} from "../store"
import CircleIcon from "../assets/svg/circle.svg"
import CircleCloseIcon from "../assets/svg/circle-close.svg"
import CircleMinimizeIcon from "../assets/svg/circle-minimize.svg"
import CircleMaximizeIcon from "../assets/svg/circle-maximize.svg"
import CloseIcon from "../assets/svg/close.svg"
import MinimizeIcon from "../assets/svg/minimize.svg"
import MaximizeIcon from "../assets/svg/maximize.svg"
import Icon from "../assets/svg/icon.svg"
import UploadIcon from "../assets/svg/upload.svg"
import SearchIcon from "../assets/svg/search.svg"
import PasteIcon from "../assets/svg/paste.svg"
import DrawIcon from "../assets/svg/draw.svg"
import EraseIcon from "../assets/svg/erase.svg"
import DrawIncreaseIcon from "../assets/svg/draw-increase.svg"
import DrawDecreaseIcon from "../assets/svg/draw-decrease.svg"
import DrawUndoIcon from "../assets/svg/draw-undo.svg"
import DrawInvertIcon from "../assets/svg/draw-invert.svg"
import SquareIcon from "../assets/svg/square.svg"
import CancelIcon from "../assets/svg/cancel.svg"
import AcceptIcon from "../assets/svg/accept.svg"
import GIFIcon from "../assets/svg/gif.svg"
import ImageDragIcon from "../assets/svg/img-drag.svg"
import ImagePanIcon from "../assets/svg/img-pan.svg"
import TransparentIcon from "../assets/svg/transparent.svg"
import PinIcon from "../assets/svg/pin.svg"
import LightIcon from "../assets/svg/light.svg"
import DarkIcon from "../assets/svg/dark.svg"
import WindowsIcon from "../assets/svg/windows.svg"
import MacIcon from "../assets/svg/mac.svg"
import "./styles/titlebar.less"

const TitleBar: React.FunctionComponent = () => {
    const {hover, imageDrag} = useActiveSelector()
    const {setImageDrag} = useActiveActions()
    const {drawing, erasing, brushColor} = useDrawingSelector()
    const {setErasing, setBrushColor} = useDrawingActions()
    const {theme, os, transparent, pinned} = useThemeSelector()
    const {setTheme, setOS, setTransparent, setPinned} = useThemeActions()
    const [acceptAction, setAcceptAction] = useState(null as any)
    const [iconHover, setIconHover] = useState(false)

    useEffect(() => {
        const triggerAcceptAction = (event: any, action: string) => {
            setAcceptAction(action)
        }
        const clearAcceptAction = (event: any, action: string) => {
            setAcceptAction(null)
        }
        window.ipcRenderer.on("trigger-accept-action", triggerAcceptAction)
        window.ipcRenderer.on("clear-accept-action", clearAcceptAction)
        return () => {
            window.ipcRenderer.removeListener("trigger-accept-action", triggerAcceptAction)
            window.ipcRenderer.removeListener("clear-accept-action", clearAcceptAction)
        }
    }, [])

    useEffect(() => {
        const keyDown = async (event: globalThis.KeyboardEvent) => {
            if (event.key === "t") {
                switchTransparency()
            }
        }
        document.addEventListener("keydown", keyDown)
        return () => {
            document.removeEventListener("keydown", keyDown)
        }
    })

    const onMouseDown = () => {
        window.ipcRenderer.send("moveWindow")
    }

    const close = () => {
        window.ipcRenderer.invoke("close")
    }

    const minimize = async () => {
        await window.ipcRenderer.invoke("minimize")
        setIconHover(false)
    }

    const maximize = () => {
        window.ipcRenderer.invoke("maximize")
    }

    const upload = () => {
        window.ipcRenderer.invoke("upload-file")
    }

    const search = () => {
        window.ipcRenderer.invoke("show-link-dialog")
    }

    const paste = () => {
        window.ipcRenderer.invoke("trigger-paste")
    }

    const gif = () => {
        window.ipcRenderer.invoke("show-gif-dialog")
    }

    const drag = () => {
        setImageDrag(!imageDrag)
    }

    const draw = () => {
        if (drawing) return setErasing(!erasing)
        window.ipcRenderer.invoke("draw")
    }

    const undo = () => {
        window.ipcRenderer.invoke("draw-undo")
    }

    const invert = () => {
        window.ipcRenderer.invoke("draw-invert")
    }

    const increaseSize = () => {
        window.ipcRenderer.invoke("draw-increase-size")
    }

    const decreaseSize = () => {
        window.ipcRenderer.invoke("draw-decrease-size")
    }

    const switchTheme = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    const switchOSStyle = () => {
        setOS(os === "mac" ? "windows" : "mac")
    }

    const switchTransparency = () => {
        setTransparent(!transparent)
    }

    const switchPinned = () => {
        setPinned(!pinned)
    }

    const triggerAction = (response: "accept" | "cancel" | "square") => {
        window.ipcRenderer.invoke("accept-action-response", acceptAction, response)
        if (response !== "square") setAcceptAction(null)
    }

    const macTitleBar = () => {
        return (
            <div className="title-group-container">
                <div className="title-mac-container" onMouseEnter={() => setIconHover(true)} onMouseLeave={() => setIconHover(false)}>
                    {iconHover ? <>
                    <CircleCloseIcon className="title-mac-button" color="var(--closeButton)" onClick={close}/>
                    <CircleMinimizeIcon className="title-mac-button" color="var(--minimizeButton)" onClick={minimize}/>
                    <CircleMaximizeIcon className="title-mac-button" color="var(--maximizeButton)" onClick={maximize}/>
                    </> : <>
                    <CircleIcon className="title-mac-button" color="var(--closeButton)" onClick={close}/>
                    <CircleIcon className="title-mac-button" color="var(--minimizeButton)" onClick={minimize}/>
                    <CircleIcon className="title-mac-button" color="var(--maximizeButton)" onClick={maximize}/>
                    </>}
                </div>
                <div className="title-container">
                    <Icon className="app-icon"/>
                    <span className="title">Pic Viewer</span>
                </div>
                <div className="title-button-container">
                    {acceptAction === "draw" ? <>
                    <DrawInvertIcon className="title-bar-button" onClick={invert}/>
                    <DrawUndoIcon className="title-bar-button" onClick={undo}/>
                    <DrawIncreaseIcon className="title-bar-button" onClick={increaseSize}/>
                    <DrawDecreaseIcon className="title-bar-button" onClick={decreaseSize}/>
                    <input type="color" className="draw-color-box" onChange={(event) => setBrushColor(event.target.value)} value={brushColor}></input>
                    <CancelIcon className="title-bar-button" onClick={() => triggerAction("cancel")}/>
                    <AcceptIcon className="title-bar-button" onClick={() => triggerAction("accept")}/>
                    </> : null}
                    {acceptAction === "crop" ? <>
                    <SquareIcon className="title-bar-button" onClick={() => triggerAction("square")}/>
                    <CancelIcon className="title-bar-button" onClick={() => triggerAction("cancel")}/>
                    <AcceptIcon className="title-bar-button" onClick={() => triggerAction("accept")}/>
                    </> : null}

                    <UploadIcon className="title-bar-button" onClick={upload}/>
                    <SearchIcon className="title-bar-button" onClick={search}/>
                    <PasteIcon className="title-bar-button" onClick={paste}/>
                    {drawing && erasing ? <EraseIcon className="title-bar-button" onClick={draw}/> : 
                    <DrawIcon className="title-bar-button" onClick={draw}/>}
                    <GIFIcon className="title-bar-button" onClick={gif}/>
                    {imageDrag ?
                    <ImageDragIcon className="title-bar-button" onClick={drag}/> :
                    <ImagePanIcon className="title-bar-button" onClick={drag}/>}
                    <TransparentIcon className="title-bar-button" onClick={switchTransparency}/>
                    <PinIcon className={`title-bar-button ${pinned && "title-button-active"}`} onClick={switchPinned}/>
                    {theme === "light" ?
                    <LightIcon className="title-bar-button" onClick={switchTheme}/> :
                    <DarkIcon className="title-bar-button" onClick={switchTheme}/>}
                    <MacIcon className="title-bar-button" onClick={switchOSStyle}/>
                </div>
            </div>
        )
    }

    const windowsTitleBar = () => {
        return (
            <>
            <div className="title-group-container">
                <div className="title-container">
                    <Icon className="app-icon"/>
                    <span className="title">Pic Viewer</span>
                </div>
                <div className="title-button-container">
                    {acceptAction === "draw" ? <>
                    <DrawInvertIcon className="title-bar-button" onClick={invert}/>
                    <DrawUndoIcon className="title-bar-button" onClick={undo}/>
                    <DrawIncreaseIcon className="title-bar-button" onClick={increaseSize}/>
                    <DrawDecreaseIcon className="title-bar-button" onClick={decreaseSize}/>
                    <input type="color" className="draw-color-box" onChange={(event) => setBrushColor(event.target.value)} value={brushColor}></input>
                    <CancelIcon className="title-bar-button" onClick={() => triggerAction("cancel")}/>
                    <AcceptIcon className="title-bar-button" onClick={() => triggerAction("accept")}/>
                    </> : null}
                    {acceptAction === "crop" ? <>
                    <SquareIcon className="title-bar-button" onClick={() => triggerAction("square")}/>
                    <CancelIcon className="title-bar-button" onClick={() => triggerAction("cancel")}/>
                    <AcceptIcon className="title-bar-button" onClick={() => triggerAction("accept")}/>
                    </> : null}

                    <UploadIcon className="title-bar-button" onClick={upload}/>
                    <SearchIcon className="title-bar-button" onClick={search}/>
                    <PasteIcon className="title-bar-button" onClick={paste}/>
                    {drawing && erasing ? <EraseIcon className="title-bar-button" onClick={draw}/> : 
                    <DrawIcon className="title-bar-button" onClick={draw}/>}
                    <GIFIcon className="title-bar-button" onClick={gif}/>
                    {imageDrag ?
                    <ImageDragIcon className="title-bar-button" onClick={drag}/> :
                    <ImagePanIcon className="title-bar-button" onClick={drag}/>}
                    <TransparentIcon className="title-bar-button" onClick={switchTransparency}/>
                    <PinIcon className={`title-bar-button ${pinned && "title-button-active"}`} onClick={switchPinned}/>
                    {theme === "light" ?
                    <LightIcon className="title-bar-button" onClick={switchTheme}/> :
                    <DarkIcon className="title-bar-button" onClick={switchTheme}/>}
                    <WindowsIcon className="title-bar-button" onClick={switchOSStyle}/>
                </div>
            </div>
            <div className="title-group-container">
                <div className="title-win-container">
                    <MinimizeIcon className="title-win-button" color="var(--minimizeButton)" onClick={minimize}/>
                    <MaximizeIcon className="title-win-button" color="var(--maximizeButton)" onClick={maximize} style={{marginLeft: "4px"}}/>
                    <CloseIcon className="title-win-button" color="var(--closeButton)" onClick={close}/>
                </div>
            </div>
            </>
        )
    }

    return (
        <section className={hover ? "title-bar visible" : "title-bar"} onMouseDown={onMouseDown}>
                <div className="title-bar-drag-area">
                    {os === "mac" ? macTitleBar() : windowsTitleBar()}
                </div>
        </section>
    )
}

export default TitleBar