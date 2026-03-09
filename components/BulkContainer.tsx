/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Display - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useState, useEffect, forwardRef, useImperativeHandle} from "react"
import "./styles/bulkcontainer.less"
import {useFilterSelector, useActiveSelector} from "../store"

export interface BulkRef {
    getRefs: () => {
        imageRefs: React.RefObject<HTMLImageElement | null>[], 
        containerRefs: React.RefObject<HTMLDivElement | null>[]
    }
}

interface BulkProps {
    files: string[]
}

const BulkContainer = forwardRef<BulkRef, BulkProps>((props, ref) => {
    const {imageDrag, infoDialogActive} = useActiveSelector()
    const {pixelate} = useFilterSelector()
    const [imageRefs, setImageRefs] = useState([] as React.RefObject<HTMLImageElement | null>[])
    const [effectRefs, setEffectRefs] = useState([] as React.RefObject<HTMLCanvasElement | null>[])
    const [containerRefs, setContainerRefs] = useState([] as React.RefObject<HTMLDivElement | null>[])

    useImperativeHandle(ref, () => ({
        getRefs: () => {
            return {imageRefs, containerRefs}
        }
    }))

    useEffect(() => {
        const newImageRefs = Array.from({length: props.files.length}, () => React.createRef<HTMLImageElement>())
        const newEffectRefs = Array.from({length: props.files.length}, () => React.createRef<HTMLCanvasElement>())
        const newContainerRefs = Array.from({length: props.files.length}, () => React.createRef<HTMLDivElement>())
        setImageRefs(newImageRefs)
        setEffectRefs(newEffectRefs)
        setContainerRefs(newContainerRefs)
    }, [props.files])

    useEffect(() => {
        for (let i = 0; i < imageRefs.length; i++) {
            const imageRef = imageRefs[i]
            const effectRef = effectRefs[i]
            const containerRef = containerRefs[i]
            if (!effectRef.current || !imageRef.current || !containerRef.current) return

            const imageWidth = imageRef.current.naturalWidth
            const imageHeight = imageRef.current.naturalHeight

            const canvas = effectRef.current
            const ctx = effectRef.current.getContext("2d")!
            canvas.width = imageWidth
            canvas.height = imageHeight
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (pixelate !== 1) {
                const bufferCanvas = document.createElement("canvas")
                const bufferCtx = bufferCanvas.getContext("2d")!

                const pixelWidth = Math.max(1, Math.floor(canvas.width / pixelate))
                const pixelHeight = Math.max(1, Math.floor(canvas.height / pixelate))

                bufferCanvas.width = pixelWidth
                bufferCanvas.height = pixelHeight

                bufferCtx.drawImage(imageRef.current, 0, 0, pixelWidth, pixelHeight)
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(bufferCanvas, 0, 0, pixelWidth, pixelHeight,
                        0, 0, canvas.width, canvas.height)
                ctx.imageSmoothingEnabled = true
            } else {
                ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
            }
        }
    }, [pixelate, imageRefs, effectRefs, containerRefs])

    const generateJSX = () => {
        const jsxArray = []
        const height = 1000 / props.files.length > 100 ? 1000 / props.files.length : 100

        for (let i = 0; i < props.files.length; i++) {
            jsxArray.push(
                <div className="bulk-img-wrapper" ref={containerRefs[i]}>
                    <canvas className="bulk-effect-img" ref={effectRefs[i]} draggable={false}></canvas>
                    <img className="bulk-img" ref={imageRefs[i]} src={props.files[i]} style={{maxHeight: `${height}px`, width: "auto"}}/>
                </div>
            )
        }
        return jsxArray
    }

    const dragImage = () => {
        if (!imageDrag || infoDialogActive) return
        window.ipcRenderer.send("moveWindow")
    }

    return (
        <main className="bulk-container">
            <div className="bulk-img-container" onMouseDown={dragImage}>
                {generateJSX()}
            </div>
        </main>
    )
})

export default BulkContainer