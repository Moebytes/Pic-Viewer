import {contextBridge, ipcRenderer, clipboard, app, nativeImage, IpcRendererEvent} from "electron"

const base64ToBuffer = (base64: string) => {
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)!
    return Buffer.from(matches[2], "base64")
}

const bufferToBase64 = (buffer: Buffer, type: string) => {
    return `data:${type};base64,${buffer.toString("base64")}`
}

type SystemPath = "home" | "appData" | "userData" | "temp" | "exe" | "module" 
  | "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos" | "recent" 
  | "logs" | "crashDumps"

declare global {
  interface Window {
    platform: "mac" | "windows",
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>
      send: (channel: string, ...args: any[]) => void
      on: (channel: string, listener: (...args: any[]) => void) => any
      removeListener: (channel: string, listener: (...args: any[]) => void) => void
    },
    clipboard: {
      readText: () => Promise<string>
      writeText: (text: string) => Promise<void>
      clear: () => Promise<void>
      readImage: () => Promise<string>
      writeImage: (image: string) => Promise<void>
    },
    app: {
      getPath: (location: SystemPath) => string
    }
  }
}

contextBridge.exposeInMainWorld("ipcRenderer", {
    invoke: async (channel: string, ...args: any[]) => {
            return ipcRenderer.invoke(channel, ...args)
    },
    send: (channel: string, ...args: any[]) => {
        ipcRenderer.send(channel, ...args)
    },
    on: (channel: string, listener: (...args: any[]) => void) => {
        const subscription = (event: IpcRendererEvent, ...args: any[]) => listener(event, ...args)

        ipcRenderer.on(channel, subscription)

        return subscription
    },
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, listener)
    }
})

contextBridge.exposeInMainWorld("clipboard", {
    readText: () => ipcRenderer.invoke("clipboard:readText"),
    writeText: (text: string) => ipcRenderer.invoke("clipboard:writeText", text),
    clear: () => ipcRenderer.invoke("clipboard:clear"),
    readImage: () => ipcRenderer.invoke("clipboard:readImage"),
    writeImage: (image: string) => ipcRenderer.invoke("clipboard:writeImage", image)
})

contextBridge.exposeInMainWorld("app", {
    getPath: (location: SystemPath) => app.getPath(location)
})

contextBridge.exposeInMainWorld("platform", process.platform === "darwin" ? "mac" : "windows")