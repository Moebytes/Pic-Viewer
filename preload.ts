import {contextBridge, ipcRenderer, clipboard, app, nativeImage, IpcRendererEvent} from "electron"

type SystemPath = "home" | "appData" | "userData" | "cache" | "temp" | "exe" | "module" 
  | "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos" | "recent" 
  | "logs" | "pepperFlashSystemPlugin" | "crashDumps"

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
      readText: () => string
      writeText: (text: string) => void
      clear: () => void
      readImage: () => Electron.NativeImage
      writeImage: (image: Electron.NativeImage) => void
    },
    nativeImage: {
      createFromBuffer: (buffer: Buffer) => Electron.NativeImage
      createFromPath: (path: string) => Electron.NativeImage
    }
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
    readText: () => clipboard.readText(),
    writeText: (text: string) => clipboard.writeText(text),
    clear: () => clipboard.clear(),
    readImage: () => clipboard.readImage(),
    writeImage: (image: Electron.NativeImage) => clipboard.writeImage(image)
})

contextBridge.exposeInMainWorld("nativeImage", {
    createFromBuffer: (buffer: Buffer) => nativeImage.createFromBuffer(buffer),
    createFromPath: (path: string) => nativeImage.createFromPath(path),
})


contextBridge.exposeInMainWorld("app", {
    getPath: (location: SystemPath) => app.getPath(location)
})

contextBridge.exposeInMainWorld("platform", process.platform === "darwin" ? "mac" : "windows")