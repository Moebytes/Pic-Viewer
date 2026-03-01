/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import "bootstrap/dist/css/bootstrap.min.css"
import "react-image-crop/dist/ReactCrop.css"
import React, {useEffect} from "react"
import {createRoot} from "react-dom/client"
import {Provider} from "react-redux"
import store, {useActiveActions} from "./store"
import TitleBar from "./components/TitleBar"
import PhotoViewer from "./components/PhotoViewer"
import LinkDialog from "./components/LinkDialog"
import InfoDialog from "./components/InfoDialog"
import ContextMenu from "./components/ContextMenu"
import LocalStorage from "./LocalStorage"
import "./index.less"

const App = () => {
  const {setHover} = useActiveActions()

  useEffect(() => {
    const preventPaste = (event: ClipboardEvent) => event.preventDefault()
    document.addEventListener("paste", preventPaste)
    return () => {
      document.removeEventListener("paste", preventPaste)
    }
  }, [])

  return (
      <main className="app" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <TitleBar/>
          <ContextMenu/>
          <LocalStorage/>
          <LinkDialog/>
          <InfoDialog/>
          <PhotoViewer/>
      </main>
  )
}

const root = createRoot(document.getElementById("root")!)
root.render(<Provider store={store}><App/></Provider>)