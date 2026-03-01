import {app, BrowserWindow, Menu, MenuItemConstructorOptions, dialog, ipcMain, session, 
screen, clipboard, nativeImage, shell} from "electron"
import localShortcut from "electron-localshortcut"
import Store from "electron-store"
import dragAddon from "electron-click-drag-plugin"
import path from "path"
import process from "process"
import functions from "./structures/functions"
import mainFunctions from "./structures/mainFunctions"
import sharp from "sharp"
import pack from "./package.json"
import fs from "fs"

process.setMaxListeners(0)
let window: Electron.BrowserWindow | null
let currentDialog: Electron.BrowserWindow | null

const store = new Store()
let initialTransparent = process.platform === "win32" ? store.get("transparent", false) as boolean : true
let tempStore = {} as any
let filePath = ""

let originalImages = null as any
let originalName = null as any
let originalLink = null as any
let historyStates = [] as string[]
let historyIndex = -1

ipcMain.handle("close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
})

ipcMain.handle("minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
})

ipcMain.handle("maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
})

ipcMain.on("moveWindow", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const handle = win?.getNativeWindowHandle()
  if (!handle) return
  const windowID = process.platform === "linux" ? handle.readUInt32LE(0) : handle
  dragAddon.startDrag(windowID)
})

ipcMain.handle("clipboard:readText", (event) => {
  return clipboard.readText()
})

ipcMain.handle("clipboard:writeText", (event, text: string) => {
  clipboard.writeText(text)
})

ipcMain.handle("clipboard:clear", (event) => {
  clipboard.clear()
})

ipcMain.handle("clipboard:readImage", (event) => {
  const img = clipboard.readImage()
  if (img.isEmpty()) return ""
  return functions.bufferToBase64(img.toPNG(), "png")
})

ipcMain.handle("clipboard:writeImage", (event, image: string) => {
  if (image.startsWith("data:")) {
      clipboard.writeImage(nativeImage.createFromBuffer(functions.base64ToBuffer(image)))
  } else {
      clipboard.writeImage(nativeImage.createFromPath(image.replace("file:///", "")))
  }
})

ipcMain.on("sync-redux-state", (event, state: any) => {
    window?.webContents.send("sync-redux-state", state)
})

const updateHistoryState = (state: any) => {
  historyIndex++
  historyStates.splice(historyIndex, Infinity, state)
}

const getGIFOptions = () => {
  return store.get("gifOptions", {
    transparency: false,
    transparentColor: "#000000",
  }) as {transparency: boolean, transparentColor: string}
}

const saveImage = async (image: any, savePath: string) => {
  if (image.startsWith("file:///")) image = image.replace("file:///", "")
  if (path.extname(savePath) === ".gif") {
    mainFunctions.downloadImage(image, savePath)
  } else {
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    if (image === savePath) image = fs.readFileSync(image)
    sharp(image).toFile(savePath)
  }
}

ipcMain.handle("get-temp", (event, key: string) => {
  return tempStore[key]
})

ipcMain.handle("save-temp", (event, key: string, value: string) => {
  tempStore[key] = value
})

ipcMain.handle("close-current-dialog", () => {
  currentDialog?.close()
})

const resizeWindow = async (image: string) => {
  const keepUnlocked = store.get("keep-ratio-unlocked", false)
  if (keepUnlocked) return window?.setAspectRatio(0)

  const dim = await mainFunctions.getDimensions(image)
  const {width, height} = functions.constrainDimensions(dim.width, dim.height)
  window?.setAspectRatio(width / height)
  window?.setSize(width, height, true)
}

ipcMain.handle("resize-window", async (event, image: string) => {
  resizeWindow(image)
})

ipcMain.handle("save-image", async (event, image: any, savePath: string) => {
  saveImage(image, savePath)
  shell.showItemInFolder(path.normalize(savePath))
})

ipcMain.handle("append-history-state", async (event, images: string | string[]) => {
  if (!Array.isArray(images)) images = [images]
  updateHistoryState(images)
  return images
})

ipcMain.handle("bulk-save-directory", async (event: any) => {
  if (!window) return
  let images = historyStates[historyIndex] as any
  if (!images) return null
  const save = await dialog.showSaveDialog(window, {
    defaultPath: originalImages[0],
    filters: [
      {name: "All Files", extensions: ["*"]},
      {name: "PNG", extensions: ["png"]},
      {name: "JPG", extensions: ["jpg"]},
      {name: "GIF", extensions: ["gif"]},
      {name: "WEBP", extensions: ["webp"]},
      {name: "AVIF", extensions: ["avif"]},
      {name: "TIFF", extensions: ["tiff"]}
    ],
    properties: ["createDirectory"]
  })
  if (!save.filePath) return
  for (let i = 0; i < images.length; i++) {
    let name = path.basename(originalImages[i], path.extname(originalImages[i]))
    if (path.extname(save.filePath)) {
      name += path.extname(save.filePath)
    } else {
      name += path.extname(originalImages[i]) ? path.extname(originalImages[i]) : ".png"
    }
    saveImage(images[i], `${path.dirname(save.filePath)}/${name}`)
  }
  shell.openPath(path.dirname(save.filePath))
})

ipcMain.handle("bulk-save-overwrite", (event: any) => {
  let images = historyStates[historyIndex] as any
  if (!images) return null
  for (let i = 0; i < images.length; i++) {
    saveImage(images[i], originalImages[i])
  }
  shell.openPath(path.dirname(originalImages[0]))
})

ipcMain.handle("show-bulk-save-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "bulk-save") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 230, height: 170, x: Math.floor(bounds.width/2) + 200, y: Math.floor(bounds.height/2), 
    resizable: true, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/bulksavedialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "bulk-save"
})

ipcMain.handle("bulk-process", () => {
  window?.webContents.send("bulk-process")
})

ipcMain.handle("reset-bounds", () => {
  window?.webContents.send("reset-bounds")
})

ipcMain.handle("draw", () => {
  window?.webContents.send("draw")
})

ipcMain.handle("draw-undo", () => {
  window?.webContents.send("draw-undo")
})

ipcMain.handle("draw-invert", () => {
  window?.webContents.send("draw-invert")
})

ipcMain.handle("draw-clear", () => {
  window?.webContents.send("draw-clear")
})

ipcMain.handle("draw-increase-size", () => {
  window?.webContents.send("draw-increase-size")
})

ipcMain.handle("draw-decrease-size", () => {
  window?.webContents.send("draw-decrease-size")
})

ipcMain.handle("parse-pixiv-link", async (event, link: string) => {
  return mainFunctions.parsePixivLink(link)
})

ipcMain.handle("get-width-height", async (event, image: any) => {
  return mainFunctions.getDimensions(image)
})

ipcMain.handle("get-gif-options", () => {
  return getGIFOptions()
})

ipcMain.handle("set-gif-options", (event: any, state: any) => {
  let {transparency, transparentColor} = state
  store.set("gifOptions", {transparency, transparentColor})
})

ipcMain.handle("gif-effects", async (event: any, state: any) => {
  let {speed, reverse, transparency, transparentColor} = state
  let images = historyStates[historyIndex] as any
  if (!images) return null
  let imgArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    if (metadata.format === "gif") {
      const {frameArray, delayArray} = await functions.getGIFFrames(image, {speed: Number(speed), reverse})
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i]).toBuffer()
        newFrameArray.push(newFrame)
      }
      let transColor = transparency ? transparentColor : undefined
      const buffer = await functions.encodeGIF(newFrameArray, delayArray, metadata.width!, metadata.height!, {transparentColor: transColor})
      const base64 = functions.bufferToBase64(buffer, "gif")
      imgArray.push(base64)
    }
  }
  updateHistoryState(imgArray)
  window?.webContents.send("update-images", imgArray)
  store.set("gifOptions", {transparency, transparentColor})
})

ipcMain.handle("show-gif-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "gif") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 190, height: 240, x: bounds.x + bounds.width - 190 - 170, y: bounds.y + 60, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/gifdialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "gif"
})

ipcMain.handle("get-original-link", async () => {
  return originalLink
})

ipcMain.handle("set-original-link", async (event, link: any) => {
  originalLink = link
})

ipcMain.handle("get-original-name", async () => {
  return originalName
})

ipcMain.handle("set-original-name", async (event, name: any) => {
  originalName = name
})

ipcMain.handle("tiff-to-png", async (event, file: string) => {
  if (file.startsWith("file:///")) file = file.replace("file:///", "")
  const buffer = await sharp(file).png().toBuffer()
  return functions.bufferToBase64(buffer, "png")
})

ipcMain.handle("escape-pressed", () => {
  window?.webContents.send("escape-pressed")
  currentDialog?.webContents.send("escape-pressed")
})

ipcMain.handle("enter-pressed", () => {
  window?.webContents.send("enter-pressed")
  currentDialog?.webContents.send("enter-pressed")
})

ipcMain.handle("accept-action-response", (event: any, action: string, response: "accept" | "cancel") => {
  window?.webContents.send("accept-action-response", action, response)
})

ipcMain.handle("clear-accept-action", (event: any) => {
  window?.webContents.send("clear-accept-action")
})

ipcMain.handle("trigger-accept-action", (event: any, action: string) => {
  window?.webContents.send("trigger-accept-action", action)
})

const getMetadata = async (images: any, toBuffer?: boolean) => {
  if (!images) return null
  let metaArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    let dataURL = false
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) {
      image = await functions.linkToBase64(image)
    } else {
      if (image.startsWith("data:")) {
        image = functions.base64ToBuffer(image)
        dataURL = true
      }
    }
    let metadata = await sharp(image).metadata()
    if (metadata.format !== "gif" && toBuffer) {
      metadata = await sharp(await sharp(image).toBuffer()).metadata()
    }
    let name = null
    if (dataURL) {
      name = path.basename(originalImages[i]).startsWith("data:") ? "Image" : path.basename(originalImages[i], path.extname(originalImages[i]))
    } else {
      name = path.basename(images[i], path.extname(images[i]))
    }
    const width = metadata.width ? metadata.width : "?"
    const height = metadata.height ? metadata.height : "?"
    const dpi = metadata.density ? metadata.density : "?"
    let size = metadata.size as any
    if (!size) {
      try {
        size = fs.statSync(image).size
      } catch {
        size = "?"
      }
    }
    const frames = metadata.pages ? metadata.pages : 1
    const format = metadata.format ? metadata.format : "?"
    const space = metadata.space ? metadata.space : "?"
    const bitDepth = metadata.bitsPerSample || (metadata.depth === "uchar" ? 8 : 
      metadata.depth === "ushort" ? 16 : metadata.depth === "float" ? 32 : undefined)
    const progressive = metadata.isProgressive
    const alpha = metadata.hasAlpha
    metaArray.push({image: images[i], name, width, height, size, format, dpi, frames, space, bitDepth, progressive, alpha})
  }
  return metaArray
}

ipcMain.handle("show-info-dialog", async (event: any, i: number) => {
  let images = historyStates[historyIndex]
  const metadata = await getMetadata(images)
  if (!metadata) return

  const detail = [
    `Name: ${metadata[i].name}`,
    `Width: ${metadata[i].width}`,
    `Height: ${metadata[i].height}`,
    `DPI: ${metadata[i].dpi}`,
    `Bit Depth: ${metadata[i].bitDepth ?? "?"}`,
    `Size: ${functions.readableFileSize(metadata[i].size)}`,
    `Format: ${metadata[i].format}`,
    `Progressive: ${metadata[i].progressive ? "Yes" : "No"}`,
    `Alpha: ${metadata[i].alpha ? "Yes" : "No"}`,
    `Frames: ${metadata[i].frames}`,
    `Color Space: ${metadata[i].space}`
  ].join("\n")

  await dialog.showMessageBox(window!, {
    type: "info",
    title: "Image Info",
    message: "Image Info",
    detail,
    buttons: ["Ok"],
    noLink: true
  })
})

ipcMain.handle("get-original-metadata", async () => {
  return getMetadata(originalImages, true)
})

ipcMain.handle("get-metadata", async () => {
  let images = historyStates[historyIndex] as any
  return getMetadata(images)
})

ipcMain.handle("crop", async (event, state: any) => {
  let {x, y, width, height, realTime} = state
  x = functions.clamp(x, 0, 100)
  y = functions.clamp(y, 0, 100)
  width = functions.clamp(width, 0, 100)
  height = functions.clamp(height, 0, 100)
  if (width === 0 || height === 0) return null
  let images = historyStates[historyIndex] as any
  if (!images) return null
  let imgArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    const cropX = Math.round(metadata.width! / 100 * x)
    const cropY = Math.round(metadata.height! / 100 * y)
    const cropWidth = Math.round(metadata.width! / 100 * width)
    const cropHeight = Math.round(metadata.height! / 100 * height)
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i])
          .extract({left: cropX, top: cropY, width: cropWidth, height: cropHeight})
          .toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, cropWidth, cropHeight, {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false})
        .extract({left: cropX, top: cropY, width: cropWidth, height: cropHeight})
        .toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  if (realTime) {
    window?.webContents.send("update-images", imgArray) 
    return null
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("apply-crop", async (event, state: any) => {
  window?.webContents.send("apply-crop", state)
})

ipcMain.handle("show-crop-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "crop") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 190, height: 220, x: bounds.x + 70, y: bounds.y + 400, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/cropdialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "crop"
})

ipcMain.handle("rotate", async (event, state: any) => {
  const {degrees, realTime} = state
  let images = historyStates[historyIndex] as any
  if (!images) return null
  let imgArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let buffer = null as any
    if (metadata.format === "gif") {
      if (realTime) return null
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i])
        .ensureAlpha()
        .png()
        .rotate(degrees, {background: {r: 0, b: 0, g: 0, alpha: 0}})
        .toBuffer()
        newFrameArray.push(newFrame)
      }
      const newMeta = await sharp(newFrameArray[0]).metadata()
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, newMeta.width!, newMeta.height!, {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false})
        .ensureAlpha()
        .png()
        .rotate(degrees, {background: {r: 0, b: 0, g: 0, alpha: 0}})
        .toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  if (realTime) {
    window?.webContents.send("update-images", imgArray) 
    return null
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("apply-rotate", async (event, state: any) => {
  window?.webContents.send("apply-rotate", state)
})

ipcMain.handle("show-rotate-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "rotate") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 230, height: 170, x: bounds.x + bounds.width - 230 - 70, y: bounds.y + 60, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/rotatedialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "rotate"
})

ipcMain.handle("resize", async (event, state: any) => {
  const {width, height, percent, realTime} = state
  if (Number.isNaN(width) || Number.isNaN(height) || !Number(width)|| !Number(height)) return null
  let images = historyStates[historyIndex] as any
  if (!images) return null
  let imgArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let newWidth = percent ? (metadata.width! / 100) * Number(width) : Number(width)
    let newHeight = percent ? (metadata.height! / 100) * Number(height) : Number(height)
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      if (realTime) return null
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i])
        .resize(Math.round(newWidth), Math.round(newHeight), {fit: "fill", kernel: "cubic"})
        .toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, Number(width), Number(height), {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false})
        .resize(Math.round(newWidth), Math.round(newHeight), {fit: "fill", kernel: "cubic"})
        .toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  if (realTime) {
    window?.webContents.send("update-images", imgArray)
    return null
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("apply-resize", async (event, state: any) => {
  window?.webContents.send("apply-resize", state)
})

ipcMain.handle("show-resize-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "resize") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 230, height: 150, x: bounds.x + bounds.width - 230 - 70, y: bounds.y + 40, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/resizedialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "resize"
})

ipcMain.handle("binarize", async (event, state: any) => {
  const {binarize, realTime} = state
  let images = historyStates[historyIndex] as any
  if (!images) return null
  let imgArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      if (realTime) return null
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i])
        .threshold(binarize)
        .toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, metadata.width!, metadata.height!, {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false})
        .threshold(binarize)
        .toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  if (realTime) {
    window?.webContents.send("update-images", imgArray) 
    return null
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("apply-binarize", async (event, state: any) => {
  window?.webContents.send("apply-binarize", state)
})

ipcMain.handle("show-binarize-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "binarize") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 250, height: 130, x: bounds.x + 70, y: bounds.y + 450, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/binarizedialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "binarize"
})

ipcMain.handle("apply-pixelate", async (event, state: any) => {
  window?.webContents.send("apply-pixelate", state)
})

ipcMain.handle("show-pixelate-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "pixelate") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 250, height: 130, x: bounds.x + 70, y: bounds.y + 330, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/pixelatedialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "pixelate"
})

ipcMain.handle("blur", async (event, state: any) => {
  const {blur, sharpen, realTime} = state
  let images = historyStates[historyIndex] as any
  if (!images) return null
  let imgArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      if (realTime) return null
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i])
          .blur(blur)
          .sharpen({sigma: sharpen})
          .toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, metadata.width!, metadata.height!, {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false})
        .blur(blur)
        .sharpen({sigma: sharpen})
        .toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  if (realTime) {
    window?.webContents.send("update-images", imgArray) 
    return null
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("apply-blur", async (event, state: any) => {
  window?.webContents.send("apply-blur", state)
})

ipcMain.handle("show-blur-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "blur") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 250, height: 155, x: bounds.x + 70, y: bounds.y + 190, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/blurdialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "blur"
})

ipcMain.handle("tint", async (event, state: any) => {
  const {tint, realTime} = state
  let images = historyStates[historyIndex] as any
  if (!images) return null
  let imgArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      if (realTime) return null
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i])
        .tint(tint)
        .toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, metadata.width!, metadata.height!, {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false})
        .tint(tint)
        .toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  if (realTime) {
    window?.webContents.send("update-images", imgArray) 
    return null
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("apply-tint", async (event, state: any) => {
  window?.webContents.send("apply-tint", state)
})

ipcMain.handle("show-tint-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "tint") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 180, height: 135, x: bounds.x + 70, y: bounds.y + 130, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/tintdialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "tint"
})

ipcMain.handle("hsl", async (event, state: any) => {
  const {hue, saturation, lightness, realTime, noHistory} = state
  let images = historyStates[historyIndex] as any
  if (!images) return null
  let imgArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      if (realTime) return null
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i])
          .modulate({hue, saturation, lightness})
          .toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, metadata.width!, metadata.height!, {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false})
        .modulate({hue, saturation, lightness})
        .toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  if (realTime) {
    window?.webContents.send("update-images", imgArray) 
    return null
  }
  if (noHistory) return imgArray
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("apply-hsl", async (event, state: any) => {
  window?.webContents.send("apply-hsl", state)
})

ipcMain.handle("show-hsl-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "hsl") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 250, height: 180, x: bounds.x + 70, y: bounds.y + 50, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/hsldialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "hsl"
})

ipcMain.handle("brightness", async (event, state: any) => {
  const {brightness, contrast, realTime} = state
  let images = historyStates[historyIndex] as any
  if (!images) return null
  let imgArray = [] as any[]
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      if (realTime) return null
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i])
          .modulate({brightness: brightness})
          .linear(contrast, -(128 * contrast) + 128)
          .toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, metadata.width!, metadata.height!, {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false})
        .modulate({brightness: brightness})
        .linear(contrast, -(128 * contrast) + 128)
        .toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  if (realTime) {
    window?.webContents.send("update-images", imgArray) 
    return null
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("apply-brightness", async (event, state: any) => {
  window?.webContents.send("apply-brightness", state)
})

ipcMain.handle("show-brightness-dialog", async (event) => {
  if (currentDialog) {
    currentDialog.close()
    revertToLastState()
    // @ts-expect-error
    if (currentDialog.type === "brightness") return
  }
  const bounds = window?.getBounds()!
  currentDialog = new BrowserWindow({width: 250, height: 150, x: bounds.x + 70, y: bounds.y + 40, 
    resizable: false, show: false, frame: false, transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", webPreferences: {
    preload: path.join(__dirname, "../preload/index.js")}})
  currentDialog.loadFile(path.join(__dirname, "../renderer/brightnessdialog.html"))
  currentDialog.removeMenu()
  currentDialog.setAlwaysOnTop(true)
  currentDialog.on("closed", () => {
    currentDialog = null
  })
  // @ts-expect-error
  currentDialog.type = "brightness"
})

const revertToLastState = () => {
  let images = historyStates[historyIndex] as any
  if (images) {
    window?.webContents.send("update-images", images)
  }
}

ipcMain.handle("revert-to-last-state", async (event) => {
  return revertToLastState()
})

ipcMain.handle("get-original-images", async (event) => {
  return originalImages
})

ipcMain.handle("update-original-images", async (event, images: any) => {
  if (typeof images === "string") images = [images]
  originalImages = images
  historyStates = []
  historyIndex = -1
  updateHistoryState(images)
})

ipcMain.handle("reset", async (event) => {
  if (!originalImages) return
  historyStates = []
  historyIndex = -1
  updateHistoryState(originalImages)
  return originalImages
})

ipcMain.handle("redo", async (event) => {
  let images = historyStates[historyIndex + 1] as any
  if (images) {
    historyIndex++
    return images
  }
  return null
})

ipcMain.handle("undo", async (event) => {
  let images = historyStates[historyIndex - 1] as any
  if (images) {
    historyIndex--
    return images
  }
  return null
})

ipcMain.handle("invert", async (event) => {
  let images = historyStates[historyIndex] as any
  const imgArray = []
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        // @ts-ignore
        const newFrame = await sharp(frameArray[i]).negate({alpha: false}).toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, metadata.width!, metadata.height!, {transparentColor})
    } else {
      // @ts-ignore
      buffer = await sharp(image, {animated: true, limitInputPixels: false}).negate({alpha: false}).toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("flipY", async (event) => {
  let images = historyStates[historyIndex] as any
  const imgArray = []
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i]).flip().toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, metadata.width!, metadata.height!, {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false}).flip().toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("flipX", async (event) => {
  let images = historyStates[historyIndex] as any
  const imgArray = []
  for (let i = 0; i < images.length; i++) {
    let image = images[i]
    if (image.startsWith("file:///")) image = image.replace("file:///", "")
    if (image.startsWith("http")) image = await functions.linkToBase64(image)
    if (image.startsWith("data:")) image = functions.base64ToBuffer(image)
    const metadata = await sharp(image).metadata()
    let buffer = null as any
    if (metadata.format === "gif" && process.platform === "win32") {
      const gifOptions = getGIFOptions()
      const {frameArray, delayArray} = await functions.getGIFFrames(image)
      const newFrameArray = [] as Buffer[]
      for (let i = 0; i < frameArray.length; i++) {
        const newFrame = await sharp(frameArray[i]).flop().toBuffer()
        newFrameArray.push(newFrame)
      }
      const transparentColor = gifOptions.transparency ? gifOptions.transparentColor : undefined
      buffer = await functions.encodeGIF(newFrameArray, delayArray, metadata.width!, metadata.height!, {transparentColor})
    } else {
      buffer = await sharp(image, {animated: true, limitInputPixels: false}).flop().toBuffer()
    }
    const base64 = functions.bufferToBase64(buffer, metadata.format ?? "png")
    imgArray.push(base64)
  }
  updateHistoryState(imgArray)
  return imgArray
})

ipcMain.handle("save-dialog", async (event, defaultPath: string) => {
  if (!window) return
  const save = await dialog.showSaveDialog(window, {
    defaultPath,
    filters: [
      {name: "All Files", extensions: ["*"]},
      {name: "PNG", extensions: ["png"]},
      {name: "JPG", extensions: ["jpg"]},
      {name: "GIF", extensions: ["gif"]},
      {name: "WEBP", extensions: ["webp"]},
      {name: "AVIF", extensions: ["avif"]},
      {name: "TIFF", extensions: ["tiff"]}
    ],
    properties: ["createDirectory"]
  })
  return save.filePath ? save.filePath : null
})

ipcMain.handle("open-link", async (event, link: string) => {
  window?.webContents.send("open-link", link)
})

ipcMain.handle("show-link-dialog", async (event) => {
  window?.webContents.send("close-all-dialogs", "link")
  window?.webContents.send("show-link-dialog")
})

ipcMain.handle("next", async (event) => {
  if (!originalImages) return
  if (originalImages.length > 1) return
  let image = originalImages[0]
  if (image.startsWith("http")) return
  if (image.startsWith("data:")) return
  image = image.replace("file:///", "")
  const directory = path.dirname(image)
  const files = await mainFunctions.getSortedFiles(directory)
  const index = files.findIndex((f) => f === path.basename(image))
  if (index !== -1) {
    if (files[index + 1]) return `file:///${directory}/${files[index + 1]}`
  }
  return null
})

ipcMain.handle("previous", async (event) => {
  if (!originalImages) return
  if (originalImages.length > 1) return
  let image = originalImages[0]
  if (image.startsWith("http")) return
  if (image.startsWith("data:")) return
  image = image.replace("file:///", "")
  const directory = path.dirname(image)
  const files = await mainFunctions.getSortedFiles(directory)
  const index = files.findIndex((f) => f === path.basename(image))
  if (index !== -1) {
    if (files[index - 1]) return `file:///${directory}/${files[index - 1]}`
  }
  return null
})

ipcMain.handle("upload-file", async () => {
  window?.webContents.send("upload-file")
})

ipcMain.handle("select-directory", async () => {
  if (!window) return
  const files = await dialog.showOpenDialog(window, {
    filters: [
      {name: "All Files", extensions: ["*"]}
    ],
    properties: ["openDirectory", "createDirectory"]
  })
  return files.filePaths[0] ? files.filePaths[0] : null
})

ipcMain.handle("select-file", async () => {
  if (!window) return
  const files = await dialog.showOpenDialog(window, {
    filters: [
      {name: "All Files", extensions: ["*"]},
      {name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "avif", "tiff"]},
      {name: "GIF", extensions: ["gif"]}
    ],
    properties: ["openFile", "multiSelections"]
  })
  return files.filePaths[0] ? files.filePaths : null
})

ipcMain.handle("select-image-files", async () => {
  if (!window) return
  const files = await dialog.showOpenDialog(window, {
    filters: [
      {name: "All Files", extensions: ["*"]}
    ],
    properties: ["openDirectory", "createDirectory"]
  })
  const directory = files.filePaths[0] ? files.filePaths[0] : null
  return mainFunctions.getFiles(directory)
})

ipcMain.handle("get-theme", () => {
  return store.get("theme", "light")
})

ipcMain.handle("save-theme", (event, theme: string) => {
  store.set("theme", theme)
  const transparency = store.get("transparency", false)
  currentDialog?.webContents.send("update-theme", theme, transparency)
})

ipcMain.handle("get-os", () => {
  return store.get("os", process.platform === "darwin" ? "mac" : "windows")
})

ipcMain.handle("save-os", (event, os: string) => {
  store.set("os", os)
})

ipcMain.handle("get-transparent", () => {
  return store.get("transparent", false)
})

ipcMain.handle("save-transparent", (event, transparent: boolean) => {
  store.set("transparent", transparent)
})

ipcMain.handle("get-pinned", () => {
  return store.get("pinned", false)
})

ipcMain.handle("save-pinned", (event, pinned: boolean) => {
  store.set("pinned", pinned)
  window?.setAlwaysOnTop(pinned)
})

ipcMain.handle("get-img-drag", () => {
  return store.get("img-drag", true)
})

ipcMain.handle("save-img-drag", (event, imageDrag: boolean) => {
  store.set("img-drag", imageDrag)
})

ipcMain.handle("get-opened-file", () => {
  if (process.platform !== "darwin") {
    return process.argv[1]
  } else {
    return filePath
  }
})

ipcMain.handle("trigger-paste", (event) => {
  window?.webContents.send("trigger-paste")
})

const openFile = (argv?: any) => {
  if (process.platform !== "darwin") {
    let file = argv ? argv[2] : process.argv[1]
    window?.webContents.send("open-file", file)
  }
}

app.on("open-file", (event, file) => {
  filePath = file
  event.preventDefault()
  window?.webContents.send("open-file", file)
})

ipcMain.handle("ready-to-show", () => {
    currentDialog?.show()
    window?.focus()
})

ipcMain.handle("context-menu", (event, {x, y}) => {
  const template: MenuItemConstructorOptions[] = [
    {label: "Copy", accelerator: "CmdOrCtrl+C", click: () => event.sender.send("copy-image", {x, y})},
    {label: "Paste", accelerator: "CmdOrCtrl+V", click: () => event.sender.send("trigger-paste")},
    {type: "separator"},
    {label: "Get Info", click: () => {
      event.sender.send("show-info-dialog", {x, y})
    }},
    {label: "Reset Values", click: () => {
      tempStore = {}
    }},
    {type: "separator"},
    {label: "Lock Aspect Ratio", click: () => {
      let images = historyStates[historyIndex] as any
      if (images?.[0]) resizeWindow(images[0])
    }},
    {label: "Unlock Aspect Ratio", click: () => {
      window?.setAspectRatio(0)
    }},
    {label: "Keep Ratio Unlocked", type: "checkbox",
      checked: store.get("keep-ratio-unlocked", false) as boolean,
      click: (menuItem) => {
        store.set("keep-ratio-unlocked", menuItem.checked)
        if (menuItem.checked) window?.setAspectRatio(0)
    }},
    {type: "separator"},
    {label: "Save Image", click: () => event.sender.send("save-img")},
    {label: "Copy Address", click: () => event.sender.send("copy-address", {x, y})},
    {label: "Toggle Fullscreen", click: () => event.sender.send("fullscreen")}
  ]

  const menu = Menu.buildFromTemplate(template)
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) menu.popup({window})
})

const applicationMenu = () =>  {
  const template: MenuItemConstructorOptions[] = [
    {role: "appMenu"},
    {
      label: "File",
      submenu: [
        {label: "Open", accelerator: "CmdOrCtrl+O",
          click: (item, window) => {
            const win = window as BrowserWindow
            win.webContents.send("upload-file")
        }},
        {label: "Save", accelerator: "CmdOrCtrl+S",
          click: (item, window) => {
            const win = window as BrowserWindow
            win?.webContents.send("save-img")
        }}
      ]
    },
    {
      label: "Edit",
      submenu: [
        {label: "Copy", accelerator: "CmdOrCtrl+C",
          click: (item, window) => {
            const win = window as BrowserWindow
            const cursor = screen.getCursorScreenPoint()
            const [winX, winY] = win.getPosition()
            const x = cursor.x - winX
            const y = cursor.y - winY
            win.webContents.send("copy-image", {x, y})
        }},
        {label: "Paste", accelerator: "CmdOrCtrl+V",
          click: (item, window) => {
            const win = window as BrowserWindow
            win?.webContents.send("trigger-paste")
        }},
        {type: "separator"},
        {label: "Undo", accelerator: "CmdOrCtrl+Z",
          click: (item, window) => {
            const win = window as BrowserWindow
            win.webContents.send("trigger-undo")
        }},
        {label: "Redo", accelerator: "CmdOrCtrl+Shift+Z",
          click: (item, window) => {
            const win = window as BrowserWindow
            win?.webContents.send("trigger-redo")
        }},
        {label: "Reset Values", click: () => {
          tempStore = {}
        }}
      ]
    },
    {
      label: "View",
      submenu: [
        {label: "Zoom In", accelerator: "CmdOrCtrl+=",
          click: (item, window) => {
            const win = window as BrowserWindow
            win.webContents.send("zoom-in")
        }},
        {label: "Zoom Out", accelerator: "CmdOrCtrl+-",
          click: (item, window) => {
            const win = window as BrowserWindow
            win?.webContents.send("zoom-out")
        }},
        {type: "separator"},
        {label: "Lock Aspect Ratio",
          click: () => {
            let images = historyStates[historyIndex] as any
            if (images?.[0]) resizeWindow(images[0])
        }},
        {label: "Unlock Aspect Ratio",
          click: (item, window) => {
            const win = window as BrowserWindow
            win.setAspectRatio(0)
        }},
        {label: "Keep Ratio Unlocked", type: "checkbox",
          checked: store.get("keep-ratio-unlocked", false) as boolean,
          click: (menuItem) => {
            store.set("keep-ratio-unlocked", menuItem.checked)
            if (menuItem.checked) window?.setAspectRatio(0)
        }},
        {type: "separator"},
        {label: "Toggle Fullscreen",
          click: (item, window) => {
            const win = window as BrowserWindow
            win?.webContents.send("fullscreen")
        }}
      ]
    },
    {role: "windowMenu"},
    {
      role: "help",
      submenu: [
        {role: "reload"},
        {role: "forceReload"},
        {role: "toggleDevTools"},
        {type: "separator"},
        {label: "Online Support", click: () => shell.openExternal(pack.repository.url)}
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

const singleLock = app.requestSingleInstanceLock()

if (!singleLock) {
  app.quit()
} else {
  app.on("second-instance", (event, argv) => {
    if (window) {
      if (window.isMinimized()) window.restore()
      window.focus()
    }
    openFile(argv)
  })

  app.on("ready", () => {
    window = new BrowserWindow({width: 900, height: 650, minWidth: 200, minHeight: 200, show: false, frame: false, resizable: true,
    transparent: initialTransparent, hasShadow: false, backgroundColor: "#00000000", center: true, webPreferences: {
      preload: path.join(__dirname, "../preload/index.js")}})
    window.loadFile(path.join(__dirname, "../renderer/index.html"))
    window.removeMenu()
    applicationMenu()
    openFile()
    localShortcut.register(window, "Control+Shift+I", () => {
      window?.webContents.openDevTools()
      currentDialog?.webContents.openDevTools()
    })
    window.webContents.on("did-finish-load", () => {
      window?.show()
    })
    window.on("closed", () => {
      if (currentDialog) currentDialog.close()
      window = null
    })
    session.defaultSession.webRequest.onBeforeSendHeaders({urls: 
      ["https://*.pixiv.net/*", "https://*.pximg.net/*"]}, (details, callback) => {
      details.requestHeaders["Referer"] = "https://www.pixiv.net/"
      callback({requestHeaders: details.requestHeaders})
    })
  })
}