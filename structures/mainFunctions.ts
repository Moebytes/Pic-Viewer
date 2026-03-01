/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import fs from "fs"
import path from "path"
import unzipper from "unzipper"
import sharp from "sharp"
import functions from "./functions"

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".tiff", ".gif"]

export default class MainFunctions {
    public static parsePixivLink = async (link: string) => {
        const headers = {"Content-Type": "application/json"}
        const {illust, ugoiraMetadata} = await fetch("https://moepictures.net/api/misc/pixiv", 
            {body: JSON.stringify({url: link}), headers, method: "POST"}).then((r) => r.json())
        let url = null
        if (ugoiraMetadata) {
            const delayArray = ugoiraMetadata.frames.map((f: any) => f.delay)
            const arrayBuffer = await fetch(ugoiraMetadata.zip_urls.medium).then((r) => r.arrayBuffer())
            const zip = await unzipper.Open.buffer(functions.arrayBufferToBuffer(arrayBuffer))
            const frameArray: Buffer[] = []
            for (let i = 0; i < zip.files.length; i++) {
                frameArray.push(await zip.files[i].buffer())
            }
            const {width, height} = await MainFunctions.getDimensions(frameArray[0])
            const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
            url = functions.bufferToBase64(buffer, "gif")
        } else {
            const rawUrl = illust.image_urls.large ? illust.image_urls.large : illust.image_urls.medium
            url = await functions.linkToBase64(rawUrl)
        }
        return {name: `${illust.title}_${illust.id}`, url, siteUrl: `https://www.pixiv.net/en/artworks/${illust.id}`}
    }

    public static getDimensions = async (image: any) => {
        let input = image

        if (typeof image === "string") {
            if (image.startsWith("data:")) {
                input = functions.base64ToBuffer(image)
            }
        }
        const metadata = await sharp(input).metadata()
        return {width: metadata.width ?? 0, height: metadata.height ?? 0}
    }

    public static removeDirectory = (dir: string) => {
        if (!fs.existsSync(dir)) return
        fs.readdirSync(dir).forEach((file: string) => {
            const current = path.join(dir, file)
            if (fs.lstatSync(current).isDirectory()) {
                MainFunctions.removeDirectory(current)
            } else {
                fs.unlinkSync(current)
            }
        })
        try {
            fs.rmdirSync(dir)
        } catch (e) {
            console.log(e)
        }
    }

    public static getSortedFiles = async (dir: string) => {
        const files = await fs.promises.readdir(dir)
        return files
            .filter((f) => imageExtensions.includes(path.extname(f).toLowerCase()))
            .map(fileName => ({
                name: fileName,
                time: fs.statSync(`${dir}/${fileName}`).mtime.getTime(),
            }))
            .sort((a, b) => b.time - a.time)
            .map(file => file.name)
    }

    public static getFiles = async (dir: string | null) => {
        if (!dir) return []
        const files = await fs.promises.readdir(dir)
        return files
            .filter((f) => imageExtensions.includes(path.extname(f).toLowerCase()))
            .map((f) => `${path.dirname(dir)}/${f}`)
    }
    
    public static downloadImage = async (image: string, dest: string) => {
        if (image.startsWith("http")) {
            const arrayBuffer = await fetch(image).then((r) => r.arrayBuffer()) as any
            fs.writeFileSync(dest, Buffer.from(arrayBuffer, "binary"))
        } else if (image.startsWith("data:")) {
            const buffer = functions.base64ToBuffer(image)
            fs.writeFileSync(dest, buffer)
        } else {
            const data = fs.readFileSync(image, "binary")
            fs.writeFileSync(dest, Buffer.from(data, "binary"))
        }
    }
}