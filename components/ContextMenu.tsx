import React, {useEffect} from "react"

const ContextMenu: React.FunctionComponent = (props) => {
    useEffect(() => {
        window.oncontextmenu = (event: MouseEvent) => {
            event.preventDefault()
            window.ipcRenderer.invoke("context-menu", {
                x: event.pageX,
                y: event.pageY
            })
        }
    }, [])

    return null
}

export default ContextMenu