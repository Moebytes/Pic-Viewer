/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import GifEncoder from "gif-encoder"
import pixels from "image-pixels"
import gifFrames from "gif-frames"
import axios from "axios"
import path from "path"
import {lightColorList, darkColorList} from "../LocalStorage"

export interface ReduxState {
    brightness: number
    contrast: number
    hue: number
    saturation: number
    lightness: number
    blur: number
    sharpen: number
    pixelate: number
}

export interface AnimationFrame {
    frame: HTMLCanvasElement
    delay: number
}

export default class Functions {
    public static arrayIncludes = (str: string, arr: string[]) => {
        for (let i = 0; i < arr.length; i++) {
            if (str.includes(arr[i])) return true
        }
        return false
    }

    public static arrayRemove = <T>(arr: T[], val: T) => {
        return arr.filter((item) => item !== val)
    }

    public static findDupe = (recent: any[], info: any) => {
        for (let i = recent.length - 1; i >= 0; i--) {
            if (recent[i].songUrl === info.songUrl
                && recent[i].songName === info.songName
                && recent[i].duration === info.duration) return i
        }
        return -1
    }

    public static timeout = async (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    public static logSlider = (position: number) => {
        const minPos = 0
        const maxPos = 1
        const minValue = Math.log(60)
        const maxValue = Math.log(100)
        const scale = (maxValue - minValue) / (maxPos - minPos)
        const value = Math.exp(minValue + scale * (position - minPos))
        let adjusted = value - 100
        if (adjusted > 0) adjusted = 0
        return adjusted
      }

    public static formatSeconds = (duration: number) => {
        let seconds = Math.floor(duration % 60) as any
        let minutes = Math.floor((duration / 60) % 60) as any
        let hours = Math.floor((duration / (60 * 60)) % 24) as any
        if (Number.isNaN(seconds) || seconds < 0) seconds = 0
        if (Number.isNaN(minutes) || minutes < 0) minutes = 0
        if (Number.isNaN(hours) || hours < 0) hours = 0

        hours = (hours === 0) ? "" : ((hours < 10) ? "0" + hours + ":" : hours + ":")
        minutes = hours && (minutes < 10) ? "0" + minutes : minutes
        seconds = (seconds < 10) ? "0" + seconds : seconds
        return `${hours}${minutes}:${seconds}`
    }

    public static decodeEntities(encodedString: string) {
        const regex = /&(nbsp|amp|quot|lt|gt);/g
        const translate = {
            nbsp:" ",
            amp : "&",
            quot: "\"",
            lt  : "<",
            gt  : ">"
        } as any
        return encodedString.replace(regex, function(match, entity) {
            return translate[entity]
        }).replace(/&#(\d+);/gi, function(match, numStr) {
            const num = parseInt(numStr, 10)
            return String.fromCharCode(num)
        })
    }

    public static round = (value: number, step?: number) => {
        if (!step) step = 1.0
        const inverse = 1.0 / step
        return Math.round(value * inverse) / inverse
    }

    public static streamToBuffer = async (stream: NodeJS.ReadableStream) => {
        const chunks: Buffer[] = []
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
          stream.on("error", (err) => reject(err))
          stream.on("end", () => resolve(Buffer.concat(chunks)))
        })
        return buffer
    }

    public static getFile = async (filepath: string) => {
        const blob = await fetch(filepath).then((r) => r.blob())
        const name = path.basename(filepath).replace(".mp3", "").replace(".wav", "").replace(".flac", "").replace(".ogg", "")
        // @ts-ignore
        blob.lastModifiedDate = new Date()
        // @ts-ignore
        blob.name = name
        return blob as File
    }

    public static base64ToBuffer = (base64: string) => {
        return Buffer.from(base64.split("base64,")[1], "base64")
    }

    public static bufferToBase64 = (buffer: Buffer, type: string) => {
        return `data:${type};base64,${buffer.toString("base64")}`
    }

    public static getRotateMax = (degrees: number, width: number, height: number) => {
        degrees %= 360
        const radians = (degrees * Math.PI) / 180
        const cosine = Math.cos(radians)
        const sine = Math.sin(radians)
        let w = Math.ceil(Math.abs(width * cosine) + Math.abs(height * sine)) + 1
        let h = Math.ceil(Math.abs(width * sine) + Math.abs(height * cosine)) + 1
        if (w % 2 !== 0) w++
        if (h % 2 !== 0) h++
        return Math.max(w, h, width, height)
    }

    public static readableFileSize = (bytes: number) => {
        const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Number((bytes / Math.pow(1024, i)).toFixed(2))} ${["B", "kB", "MB", "GB", "TB"][i]}`
    }

    public static getGIFFrames = async <T extends boolean = false>(image: any, options?: {speed?: number, reverse?: boolean, canvas?: T}) => {
        const {speed = 1, reverse = false, canvas = false as T} = options || {}
        const frames = await gifFrames({url: image, frames: "all", outputType: canvas ? "canvas" : "png"})

        let frameArray = [] as unknown as T extends true ? HTMLCanvasElement[] : Buffer[]
        let delayArray = [] as number[]
        const constraint = speed > 1 ? frames.length / speed : frames.length
        let step = Math.ceil(frames.length / constraint)

        for (let i = 0; i < frames.length; i += step) {
            if (canvas) {
                frameArray.push(frames[i].getImage() as any)
            } else {
                frameArray.push(await Functions.streamToBuffer(frames[i].getImage()) as any)
            }
            delayArray.push(frames[i].frameInfo.delay * 10)
        }
        if (speed < 1) delayArray = delayArray.map((n) => n / options?.speed!)
        if (reverse) {
            frameArray = frameArray.reverse() as any
            delayArray = delayArray.reverse()
        }
        return {frameArray, delayArray}
    }

    public static parseTransparentColor = (color: string) => {
        return Number(`0x${color.replace(/^#/, "")}`)
    }

    public static arrayBufferToBuffer(arrayBuffer: ArrayBuffer) {
        const buffer = Buffer.alloc(arrayBuffer.byteLength)
        const array = new Uint8Array(arrayBuffer)
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] = array[i]
        }
        return buffer
    }

    public static linkToBase64 = async (link: string) => {
        const arrayBuffer = await axios.get(link, {responseType: "arraybuffer", headers: {referer: "https://www.pixiv.net/"}}).then((r) => r.data)
        return Functions.bufferToBase64(Functions.arrayBufferToBuffer(arrayBuffer), "png")
    }

    public static imageAtCursor = (coords: {x: number, y: number}) => {
        const images = document.querySelectorAll(".bulk-img") as NodeListOf<HTMLImageElement>
        let found = null as any
        images.forEach((i) => {
            const rect = i.getBoundingClientRect()
            if (coords.x > rect.left && 
                coords.x < rect.right && 
                coords.y > rect.top && 
                coords.y < rect.bottom) {
                found = i
            }
        })
        return found ? found.src : null
    }

    public static pathEqual = (path1: string, path2: string) => {
        return path.normalize(decodeURIComponent(path1.replace("file:///", ""))) === path.normalize(decodeURIComponent(path2.replace("file:///", "")))
    }

    public static clamp = (num: number, min: number, max: number) => {
        return Math.min(Math.max(Number(num), min), max)
    }

    public static constrainDimensions = (width: number, height: number) => {
        const maxWidth = 1450
        const maxHeight = 942
        const minWidth = 520
        const minHeight = 250

        let newWidth = width
        let newHeight = height

        if (newWidth > maxWidth || newHeight > maxHeight) {
            const scale = Math.min(
                maxWidth / newWidth,
                maxHeight / newHeight
            )
            newWidth *= scale
            newHeight *= scale
        }

        if (newWidth < minWidth || newHeight < minHeight) {
            const scale = Math.max(
                minWidth / newWidth,
                minHeight / newHeight
            )
            newWidth *= scale
            newHeight *= scale
        }
        
        return {width: Math.floor(newWidth), height: Math.floor(newHeight)}
    }

    public static updateTheme = (theme: string, transparent?: boolean) => {
        if (typeof window === "undefined") return
        const selectedTheme = theme === "light" ? lightColorList : darkColorList

        Object.entries(selectedTheme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value)
        })

        if (transparent) {
            document.documentElement.style.setProperty("--background", "transparent")
            document.documentElement.style.setProperty("--navColor", "transparent")
        }
    }

    public static imageDimensions = async (image: string) => {
        return new Promise<{width: number, height: number}>(async (resolve) => {
                const img = document.createElement("img")
                img.addEventListener("load", async () => {
                    let width = img.width
                    let height = img.height
                    resolve({width, height})
                })
                img.src = image
        })
    }

    public static createImage = async (image: string) => {
        const img = new Image()
        img.src = image
        return new Promise<HTMLImageElement>((resolve) => {
            img.onload = () => resolve(img)
        })
    }

    public static render = <T extends boolean = false>(image: HTMLImageElement | HTMLCanvasElement, container: HTMLDivElement, state: ReduxState, buffer?: T) => {
        if (!image || !container) return "" as T extends true ? ArrayBuffer : string
        let brightness = state.brightness ?? 100
        let contrast = state.contrast ?? 100
        let hue = state.hue ?? 180
        let saturation = state.saturation ?? 100
        let blur = state.blur ?? 0
        let pixelate = state.pixelate ?? 1
        const imageWidth = container.clientWidth
        const imageHeight = container.clientHeight
        const canvas = document.createElement("canvas") as HTMLCanvasElement
        canvas.width = image instanceof HTMLImageElement ? image.naturalWidth : image.width
        canvas.height = image instanceof HTMLImageElement ? image.naturalHeight : image.height
        const ctx = canvas.getContext("2d")!
        const scaleX = canvas.width / container.clientWidth
        const scaleY = canvas.height / container.clientHeight
        const scale = Math.max(scaleX, scaleY)
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur * scale}px)`
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        if (pixelate !== 1) {
            const pixelateCanvas = document.createElement("canvas")
            const pixelateCtx = pixelateCanvas.getContext("2d")!

            const pixelWidth = imageWidth / pixelate 
            const pixelHeight = imageHeight / pixelate
            pixelateCanvas.width = pixelWidth
            pixelateCanvas.height = pixelHeight

            pixelateCtx.drawImage(image, 0, 0, pixelWidth, pixelHeight)

            ctx.imageSmoothingEnabled = false
            ctx.drawImage(pixelateCanvas, 0, 0, canvas.width, canvas.height)
            ctx.imageSmoothingEnabled = true
        }
        if (buffer) {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
            return img.data.buffer as T extends true ? ArrayBuffer : string
        }
        return canvas.toDataURL("image/png") as T extends true ? ArrayBuffer : string
    }

    public static isAnimatedWebp = (buffer: ArrayBuffer) => {
        let str = ""
        const byteArray = new Uint8Array(Buffer.from(buffer))
        for (let i = 0; i < byteArray.length; i++) {
            str += String.fromCharCode(byteArray[i])
        }
        return str.indexOf("ANMF") !== -1
    }

    public static isAnimatedPng = (buffer: ArrayBuffer) => {
        let str = ""
        const byteArray = new Uint8Array(Buffer.from(buffer))
        for (let i = 0; i < byteArray.length; i++) {
            str += String.fromCharCode(byteArray[i])
        }
        return str.indexOf("acTL") !== -1
    }

    public static extractAnimationFrames = async (data: ArrayBuffer, format = "gif") => {
        let index = 0
        let imageDecoder = new ImageDecoder({data, type: `image/${format}`, preferAnimation: true})
        let result = [] as AnimationFrame[]
        while (true) {
            try {
                const decoded = await imageDecoder.decode({frameIndex: index++})
                const canvas = document.createElement("canvas")
                canvas.width = decoded.image.codedWidth
                canvas.height = decoded.image.codedHeight
                const canvasContext = canvas.getContext("2d")!
                const image = await createImageBitmap(decoded.image)
                canvasContext.drawImage(image, 0, 0)
                const duration = decoded.image.duration || 0
                result.push({frame: canvas, delay: duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static yieldToUI = () => {
        return new Promise<void>((resolve) => setTimeout(resolve, 0))
    }

    public static encodeGIF = async (frames: Buffer[], delays: number[], width: number, height: number, options?: {transparentColor?: string}) => {
        const gif = new GifEncoder(width, height, {highWaterMark: 5 * 1024 * 1024})
        gif.setQuality(10)
        if (options?.transparentColor) gif.setTransparent(Functions.parseTransparentColor(options.transparentColor))
        gif.setRepeat(0)
        gif.writeHeader()

        const chunks: Buffer[] = []

        gif.on("data", (chunk: Buffer) => {
            chunks.push(chunk)
        })

        const finished = new Promise<Buffer>((resolve, reject) => {
            gif.on("end", () => {
                resolve(Buffer.concat(chunks))
            })
            gif.on("error", reject)
        })

        for (let i = 0; i < frames.length; i++) {
            const {data} = await pixels(frames[i], {width, height})
            gif.setDelay(delays[i])
            gif.addFrame(data)

            if (i % 2 === 0) {
                await Functions.yieldToUI()
            }
        }

        gif.finish()

        return finished
    }
}
