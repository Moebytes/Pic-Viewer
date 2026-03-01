/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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