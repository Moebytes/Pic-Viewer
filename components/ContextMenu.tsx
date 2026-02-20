import React, {useEffect, useState, useRef} from "react"
import functions from "../structures/functions"
import "./styles/contextmenu.less"

const ContextMenu: React.FunctionComponent = (props) => {
    const [visible, setVisible] = useState(false)
    const [hover, setHover] = useState(false)
    const contextMenu = useRef<HTMLDivElement>(null)

    useEffect(() => {
        window.onclick = () => {
            if (!hover) setVisible(false)
        }
        window.oncontextmenu = (event: MouseEvent) => {
            setVisible(true)
            contextMenu.current!.style.left = `${event.x}px`
            contextMenu.current!.style.top = `${event.y}px`
        }
    }, [])

    const copy = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const selectedText = window.getSelection()?.toString().trim()
        if (selectedText) {
            window.clipboard.writeText(selectedText)
        } else {
            const image = functions.imageAtCursor(event)
            window.ipcRenderer.invoke("copy-image", image)
        }
    }

    const paste = () => {
        window.ipcRenderer.invoke("trigger-paste")
    }

    const getInfo = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const image = functions.imageAtCursor(event)
        console.log(image)
        window.ipcRenderer.invoke("get-info", image)
    }

    const saveImage = () => {
        window.ipcRenderer.invoke("save-img")
    }

    const copyAddress = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const image = functions.imageAtCursor(event)
        window.ipcRenderer.invoke("copy-address", image)
    }

    const clearCache = () => {
        window.ipcRenderer.invoke("clear-temp")
    }


    if (visible) {
        return (
            <section ref={contextMenu} className="context-menu" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <button className="context-button" onClick={(event) => copy(event)}>Copy</button>
                <button className="context-button" onClick={() => paste()}>Paste</button>
                <button className="context-button" onClick={(event) => getInfo(event)}>Get Info</button>
                <button className="context-button" onClick={() => clearCache()}>Clear Cache</button>
                <button className="context-button" onClick={() => saveImage()}>Save Image</button>
                <button className="context-button" onClick={(event) => copyAddress(event)}>Copy Address</button>
            </section>
        )
    }
    return null
}

export default ContextMenu