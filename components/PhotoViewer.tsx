import React, {useEffect, useState, useRef} from "react"
import {useDrawingSelector, useDrawingActions} from "../store"
import ReactCrop from "react-image-crop"
import BrightnessIcon from "../assets/svg/brightness.svg"
import HueIcon from "../assets/svg/hue.svg"
import TintIcon from "../assets/svg/tint.svg"
import BlurIcon from "../assets/svg/blur.svg"
import PixelateIcon from "../assets/svg/pixelate.svg"
import InvertIcon from "../assets/svg/invert.svg"
import BinarizeIcon from "../assets/svg/binarize.svg"
import CropIcon from "../assets/svg/crop.svg"
import ResizeIcon from "../assets/svg/resize.svg"
import RotateIcon from "../assets/svg/rotate.svg"
import FlipXIcon from "../assets/svg/flipx.svg"
import FlipYIcon from "../assets/svg/flipy.svg"
import UndoIcon from "../assets/svg/undo.svg"
import RedoIcon from "../assets/svg/redo.svg"
import SaveIcon from "../assets/svg/save.svg"
import ResetIcon from "../assets/svg/reset.svg"
import PreviousIcon from "../assets/svg/previous.svg"
import NextIcon from "../assets/svg/next.svg"
import functions from "../structures/functions"
import CanvasDraw from "../structures/CanvasDraw"
import {TransformWrapper, TransformComponent} from "react-zoom-pan-pinch"
import BulkContainer from "./BulkContainer"
import {useDropzone} from "react-dropzone"
import path from "path"
import "./styles/photoviewer.less"

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".tiff", ".gif"]

let oldY = 0

const PhotoViewer: React.FunctionComponent = () => {
    const {drawing, erasing, brushColor} = useDrawingSelector()
    const {setDrawing, setErasing} = useDrawingActions()
    const [brightnessHover, setBrightnessHover] = useState(false)
    const [hueHover, setHueHover] = useState(false)
    const [tintHover, setTintHover] = useState(false)
    const [blurHover, setBlurHover] = useState(false)
    const [pixelateHover, setPixelateHover] = useState(false)
    const [invertHover, setInvertHover] = useState(false)
    const [binarizeHover, setBinarizeHover] = useState(false)
    const [cropHover, setCropHover] = useState(false)
    const [resizeHover, setResizeHover] = useState(false)
    const [rotateHover, setRotateHover] = useState(false)
    const [flipXHover, setFlipXHover] = useState(false)
    const [flipYHover, setFlipYHover] = useState(false)
    const [undoHover, setUndoHover] = useState(false)
    const [redoHover, setRedoHover] = useState(false)
    const [saveHover, setSaveHover] = useState(false)
    const [resetHover, setResetHover] = useState(false)
    const [previousHover, setPreviousHover] = useState(false)
    const [nextHover, setNextHover] = useState(false)
    const [image, setImage] = useState("")
    const [hover, setHover] = useState(false)
    const initialCropState = {unit: "%", x: 0, y: 0, width: 100, height: 100, aspect: undefined}
    const [cropState, setCropState] = useState(initialCropState)
    const [cropEnabled, setCropEnabled] = useState(false)
    const [zoomScale, setZoomScale] = useState(1)
    const [rotateDegrees, setRotateDegrees] = useState(0)
    const [rotateEnabled, setRotateEnabled] = useState(false)
    const [bulk, setBulk] = useState(false)
    const [bulkFiles, setBulkFiles] = useState(null) as any
    const [brushSize, setBrushSize] = useState(25)
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const drawRef = useRef<HTMLCanvasElement>(null) as any
    const zoomRef = useRef(null) as any

    useEffect(() => {
        const getOpenedFile = async () => {
            const file = await window.ipcRenderer.invoke("get-opened-file")
            if (file && imageExtensions.includes(path.extname(file).toLowerCase())) {
                upload(file)
            }
        }
        getOpenedFile()
        const openFile = (event: any, file: string) => {
            if (file) upload(file)
        }
        const uploadFile = (event: any) => {
            upload()
        }
        const openLink = async (event: any, link: string) => {
            if (link) {
                let img = link
                if (link.includes("pixiv.net") || link.includes("pximg.net")) {
                    const {name, url, siteUrl} = await window.ipcRenderer.invoke("parse-pixiv-link")
                    window.ipcRenderer.invoke("set-original-name", name)
                    window.ipcRenderer.invoke("set-original-link", siteUrl)
                    img = url
                } else {
                    window.ipcRenderer.invoke("set-original-link", img)
                    window.ipcRenderer.invoke("set-original-name", null)
                }
                setImage(img)
                window.ipcRenderer.invoke("update-original-images", img)
                resetZoom()
                resetRotation()
                setBulk(false)
                setBulkFiles(null)
            }
        }
        const triggerPaste = () => {
            const img = window.clipboard.readImage()
            if (img.isEmpty()) return
            const base64 = functions.bufferToBase64(img.toPNG(), "png")
            setImage(base64)
            window.ipcRenderer.invoke("update-original-images", base64)
            window.ipcRenderer.invoke("set-original-name", null)
            window.ipcRenderer.invoke("set-original-link", null)
            resetZoom()
            resetRotation()
            setBulk(false)
            setBulkFiles(null)
        }
        const resetBounds = () => {
            resetZoom()
            resetRotation()
        }
        const doubleClick = () => {
            resetRotation()
        }
        window.ipcRenderer.on("open-file", openFile)
        window.ipcRenderer.on("open-link", openLink)
        window.ipcRenderer.on("upload-file", uploadFile)
        window.ipcRenderer.on("trigger-paste", triggerPaste)
        window.ipcRenderer.on("apply-brightness", brightness)
        window.ipcRenderer.on("apply-hsl", hue)
        window.ipcRenderer.on("apply-tint", tint)
        window.ipcRenderer.on("apply-blur", blur)
        window.ipcRenderer.on("apply-pixelate", pixelate)
        window.ipcRenderer.on("apply-resize", resize)
        window.ipcRenderer.on("apply-rotate", rotate)
        window.ipcRenderer.on("apply-binarize", binarize)
        window.ipcRenderer.on("apply-crop", bulkCrop)
        window.ipcRenderer.on("zoom-in", zoomIn)
        window.ipcRenderer.on("zoom-out", zoomOut)
        window.ipcRenderer.on("reset-bounds", resetBounds)
        window.ipcRenderer.on("bulk-process", bulkProcess)
        window.ipcRenderer.on("draw", draw)
        window.ipcRenderer.on("draw-undo", undoDraw)
        window.ipcRenderer.on("draw-clear", clearDraw)
        window.ipcRenderer.on("draw-increase-size", increaseBrushSize)
        window.ipcRenderer.on("draw-decrease-size", decreaseBrushSize)
        document.addEventListener("dblclick", doubleClick)
        return () => {
            window.ipcRenderer.removeListener("open-file", openFile)
            window.ipcRenderer.removeListener("upload-file", openFile)
            window.ipcRenderer.removeListener("open-link", openLink)
            window.ipcRenderer.removeListener("trigger-paste", triggerPaste)
            window.ipcRenderer.removeListener("apply-brightness", brightness)
            window.ipcRenderer.removeListener("apply-hsl", hue)
            window.ipcRenderer.removeListener("apply-tint", tint)
            window.ipcRenderer.removeListener("apply-blur", blur)
            window.ipcRenderer.removeListener("apply-pixelate", pixelate)
            window.ipcRenderer.removeListener("apply-resize", resize)
            window.ipcRenderer.removeListener("apply-rotate", rotate)
            window.ipcRenderer.removeListener("apply-binarize", binarize)
            window.ipcRenderer.removeListener("zoom-in", zoomIn)
            window.ipcRenderer.removeListener("zoom-out", zoomOut)
            window.ipcRenderer.removeListener("reset-bounds", resetBounds)
            window.ipcRenderer.removeListener("bulk-process", bulkProcess)
            window.ipcRenderer.removeListener("draw", draw)
            window.ipcRenderer.removeListener("draw-undo", undoDraw)
            window.ipcRenderer.removeListener("draw-clear", clearDraw)
            window.ipcRenderer.removeListener("draw-increase-size", increaseBrushSize)
            window.ipcRenderer.removeListener("draw-decrease-size", decreaseBrushSize)
            document.removeEventListener("dblclick", doubleClick)
            window.ipcRenderer.removeListener("apply-crop", bulkCrop)
        }
    }, [])

    useEffect(() => {
        window.ipcRenderer.on("draw-invert", invertDraw)
        return () => {
            window.ipcRenderer.removeListener("draw-invert", invertDraw)
        }
    }, [brushColor])

    useEffect(() => {
        const triggerUndo = () => {
            if (drawing) return undoDraw()
            undo()
        }
        const triggerRedo = () => {
            if (drawing) return
            redo()
        }
        window.ipcRenderer.on("trigger-undo", triggerUndo)
        window.ipcRenderer.on("trigger-redo", triggerRedo)
        return () => {
            window.ipcRenderer.removeListener("trigger-undo", triggerUndo)
            window.ipcRenderer.removeListener("trigger-redo", triggerRedo)
        }
    }, [drawing])

    const onDrop = (files: any) => {
        files = files.map((f: any) => f.path)
        if (files[0]) {
            upload(files)
        }
    }

    const {getRootProps} = useDropzone({onDrop})

    useEffect(() => {
        const updateDimensions = async () => {
            const dim = await functions.imageDimensions(image)
            let greaterValue = dim.width > dim.height ? dim.width : dim.height
            const heightBigger = dim.height > dim.width
            const ratio = greaterValue / (heightBigger ? 650 : 900)
            const width = Math.floor(dim.width / ratio)
            const height = Math.floor(dim.height / ratio)
            setWidth(width)
            setHeight(height)
        }
        updateDimensions()
        const copyImage = (event: any, img: any) => {
            if (bulk) {
                if (!img) return
                if (img.startsWith("data:")) {
                    window.clipboard.writeImage(window.nativeImage.createFromBuffer(functions.base64ToBuffer(img)))
                } else {
                    window.clipboard.writeImage(window.nativeImage.createFromPath(img.replace("file:///", "")))
                }
            } else {
                if (image.startsWith("data:")) {
                    window.clipboard.writeImage(window.nativeImage.createFromBuffer(functions.base64ToBuffer(image)))
                } else {
                    window.clipboard.writeImage(window.nativeImage.createFromPath(image.replace("file:///", "")))
                }
            }
        }
        const copyAddress = async (event: any, img: any) => {
            if (bulk) {
                if (!img) return
                window.clipboard.writeText(img)
            } else {
                const originalLink = await window.ipcRenderer.invoke("get-original-link")
                if (originalLink) {
                    window.clipboard.writeText(originalLink)
                } else {
                    const img = await window.ipcRenderer.invoke("get-original-images")
                    window.clipboard.writeText(img[0])
                }
            }
        }
        const updateImages = (event: any, images: string) => {
            if (images) bulk ? setBulkFiles(images) : setImage(images[0])
        }
        window.ipcRenderer.on("copy-image", copyImage)
        window.ipcRenderer.on("copy-address", copyAddress)
        window.ipcRenderer.on("save-img", save)
        window.ipcRenderer.on("update-images", updateImages)
        return () => {
            window.ipcRenderer.removeListener("copy-image", copyImage)
            window.ipcRenderer.removeListener("copy-address", copyAddress)
            window.ipcRenderer.removeListener("save-img", save)
            window.ipcRenderer.removeListener("update-images", updateImages)
        }
    }, [image, bulk, bulkFiles])

    useEffect(() => {
        const commitCrop = async (response: "accept" | "cancel" | "square") => {
            if (response === "square") {
                return setCropState((prev: any) => {
                    return {...prev, aspect: prev.aspect ? undefined : 1}
                })
            } else if (response === "accept") {
                const newImages = await window.ipcRenderer.invoke("crop", cropState)
                if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
            }
            toggleCrop(false)
            window.ipcRenderer.invoke("clear-accept-action")
        }
        const commitDraw = async (response: "accept" | "cancel" | "square") => {
            if (response === "accept") {
                saveDrawing()
            }
            setDrawing(false)
            setErasing(false)
            window.ipcRenderer.invoke("clear-accept-action")
        }
        const acceptActionResponse = (event: any, action: string, response: "accept" | "cancel" | "square") => {
            if (action === "crop") {
                commitCrop(response)
            } else if (action === "draw") {
                commitDraw(response)
            }
        }
        const keyDown = async (event: globalThis.KeyboardEvent) => {
            if (event.key === "Enter") {
                if (cropEnabled) commitCrop("accept")
                if (drawing) commitDraw("accept")
                window.ipcRenderer.invoke("enter-pressed")
            }
            if (event.key === "Escape") {
                if (cropEnabled) commitCrop("cancel")
                if (drawing) commitDraw("cancel")
                window.ipcRenderer.invoke("escape-pressed")
                resetRotation()
            }
            if (event.code === "Space") {
                const selection = document.querySelector(".ReactCrop__crop-selection") as HTMLDivElement
                if (selection?.style.opacity === "1") {
                    setCropEnabled(false)
                }
                document.documentElement.style.setProperty("cursor", "grab", "important")
            }
            if (event.key === "r") {
                if (drawing) return
                if (rotateEnabled) {
                    const selection = document.querySelector(".ReactCrop__crop-selection") as HTMLDivElement
                    if (selection?.style.opacity === "1") {
                        setCropEnabled(true)
                    }
                    document.documentElement.style.setProperty("cursor", "default")
                    setRotateEnabled(false)
                } else {
                    const selection = document.querySelector(".ReactCrop__crop-selection") as HTMLDivElement
                    if (selection?.style.opacity === "1") {
                        setCropEnabled(false)
                    }
                    document.documentElement.style.setProperty("cursor", "row-resize", "important")
                    setRotateEnabled(true)
                }
            }
            if (event.key === "q") decreaseBrushSize()
            if (event.key === "w") increaseBrushSize()
            if (event.key === "b") {
                if (!drawing) draw()
                setErasing(false)
            }
            if (event.key === "e") setErasing(true)
        }
        const keyUp = (event: globalThis.KeyboardEvent) => {
            if (event.code === "Space") {
                const selection = document.querySelector(".ReactCrop__crop-selection") as HTMLDivElement
                if (selection?.style.opacity === "1") {
                    setCropEnabled(true)
                }
                document.documentElement.style.setProperty("cursor", "default")
            }
        }
        const mouseMove = (event: MouseEvent) => {
                if (rotateEnabled) {
                    if (event.pageY > oldY) {
                        // Up
                        setRotateDegrees((prev) => {
                            const newDegrees = prev - 3
                            if (newDegrees < -180) return 180
                            return newDegrees
                        })
                    } else if (event.pageY < oldY) {
                        // Down
                        setRotateDegrees((prev) => {
                            const newDegrees = prev + 3
                            if (newDegrees > 180) return -180
                            return newDegrees
                        })
                    }
                    oldY = event.pageY
                }
        }
        const onClick = async () => {
            const selection = document.querySelector(".ReactCrop__crop-selection") as HTMLDivElement
            if (selection?.style.opacity === "1") {
                setCropEnabled(true)
            }
            document.documentElement.style.setProperty("cursor", "default")
            setRotateEnabled(false)
        }
        const wheel = (event: WheelEvent) => {
            /*
            // @ts-ignore
            const trackPad = event.wheelDeltaY ? event.wheelDeltaY === -3 * event.deltaY : event.deltaMode === 0
            if (event.deltaY < 0) {
                if (trackPad) {
                    increaseBrushSize()
                } else {
                    decreaseBrushSize()
                }
            } else {
                if (trackPad) {
                    decreaseBrushSize()
                } else {
                    increaseBrushSize()
                }
            }*/
        }
        window.ipcRenderer.on("accept-action-response", acceptActionResponse)
        document.addEventListener("wheel", wheel)
        document.addEventListener("keydown", keyDown)
        document.addEventListener("keyup", keyUp)
        document.addEventListener("mousemove", mouseMove)
        document.addEventListener("click", onClick)
        return () => {
            window.ipcRenderer.removeListener("accept-action-response", acceptActionResponse)
            document.removeEventListener("wheel", wheel)
            document.removeEventListener("keydown", keyDown)
            document.removeEventListener("keyup", keyUp)
            document.removeEventListener("mousemove", mouseMove)
            document.removeEventListener("click", onClick)
        }
    })

    const upload = async (files?: string | string[]) => {
        if (typeof files === "string") files = [files]
        if (!files) files = await window.ipcRenderer.invoke("select-file") as string[]
        if (!files) return
        files = files.filter((f) => imageExtensions.includes(path.extname(f).toLowerCase()))
        if (files.length > 1) {
            setBulkFiles(files)
            setBulk(true)
            return window.ipcRenderer.invoke("update-original-images", files)
        }
        const file = files[0]
        if (!imageExtensions.includes(path.extname(file).toLowerCase())) return
        let newImg = file
        if (path.extname(file) === ".tiff") {
            newImg = await window.ipcRenderer.invoke("tiff-to-png", file)
            window.ipcRenderer.invoke("set-original-name", path.basename(file, path.extname(file)))
        }
        setImage(newImg)
        window.ipcRenderer.invoke("resize-window", newImg)
        window.ipcRenderer.invoke("update-original-images", newImg)
        window.ipcRenderer.invoke("set-original-link", null)
        resetZoom()
        resetRotation()
        setBulk(false)
        setBulkFiles(null)
    }

    const bulkCrop = async (event: any, state: any) => {
        const newImages = await window.ipcRenderer.invoke("crop", state)
        if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
    }

    const brightness = async (event?: any, state?: any) => {
        if (!state) {
            window.ipcRenderer.invoke("show-brightness-dialog")
        } else {
            const newImages = await window.ipcRenderer.invoke("brightness", state)
            if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
        }
    }

    const hue = async (event?: any, state?: any) => {
        if (!state) {
            window.ipcRenderer.invoke("show-hsl-dialog")
        } else {
            const newImages = await window.ipcRenderer.invoke("hsl", state)
            if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
        }
    }

    const tint = async (event?: any, state?: any) => {
        if (!state) {
            window.ipcRenderer.invoke("show-tint-dialog")
        } else {
            const newImages = await window.ipcRenderer.invoke("tint", state)
            if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
        }
    }

    const blur = async (event?: any, state?: any) => {
        if (!state) {
            window.ipcRenderer.invoke("show-blur-dialog")
        } else {
            const newImages = await window.ipcRenderer.invoke("blur", state)
            if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
        }
    }

    const pixelate = async (event?: any, state?: any) => {
        if (!state) {
            window.ipcRenderer.invoke("show-pixelate-dialog")
        } else {
            const newImages = await window.ipcRenderer.invoke("pixelate", state)
            if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
        }
    }

    const invert = async () => {
        const newImages = await window.ipcRenderer.invoke("invert")
        if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
    }

    const binarize = async (event?: any, state?: any) => {
        if (!state) {
            window.ipcRenderer.invoke("show-binarize-dialog")
        } else {
            const newImages = await window.ipcRenderer.invoke("binarize", state)
            if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
        }
    }

    const toggleCrop = (value?: boolean) => {
        if (bulk) {
            window.ipcRenderer.invoke("show-crop-dialog")
        } else {
            let newState = value !== undefined ? value : !cropEnabled
            if (newState === true) {
                const selection = document.querySelector(".ReactCrop__crop-selection") as HTMLDivElement
                selection.style.opacity = "1"
                setCropState((prev) => {
                    return {...prev, x: 0, y: 0, width: 100, height: 100}
                })
                setCropEnabled(true)
                window.ipcRenderer.invoke("trigger-accept-action", "crop")
            } else {
                const selection = document.querySelector(".ReactCrop__crop-selection") as HTMLDivElement
                selection.style.opacity = "0"
                setCropEnabled(false)
                window.ipcRenderer.invoke("clear-accept-action")
            }
        }
    }

    const resize = async (event?: any, state?: any) => {
        if (!state) {
            window.ipcRenderer.invoke("show-resize-dialog")
        } else {
            const newImages = await window.ipcRenderer.invoke("resize", state)
            if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
        }
    }

    const rotate = async (event?: any, state?: any) => {
        if (!state) {
            window.ipcRenderer.invoke("show-rotate-dialog")
        } else {
            const newImages = await window.ipcRenderer.invoke("rotate", state)
            if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
        }
    }

    const flipX = async () => {
        const newImages = await window.ipcRenderer.invoke("flipX")
        if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
    }

    const flipY = async () => {
        const newImages = await window.ipcRenderer.invoke("flipY")
        if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
    }

    const undo = async () => {
        const newImages = await window.ipcRenderer.invoke("undo")
        if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
    }

    const redo = async () => {
        const newImages = await window.ipcRenderer.invoke("redo")
        if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
    }

    const save = async () => {
        if (bulk) {
            window.ipcRenderer.invoke("show-bulk-save-dialog")
        } else {
            let defaultPath = await window.ipcRenderer.invoke("get-original-images").then((r) => r[0])
            if (defaultPath.startsWith("data:") || defaultPath.startsWith("http")) {
                let name = null as any
                if (defaultPath.startsWith("data:")) {
                    const originalName = await window.ipcRenderer.invoke("get-original-name")
                    if (originalName) {
                        name = originalName
                    } else {
                        name = "image"
                    }
                } else {
                    name = path.basename(defaultPath)
                }
                defaultPath = `${window.app.getPath("downloads")}/${name}`
            }
            let savePath = await window.ipcRenderer.invoke("save-dialog", defaultPath)
            if (!savePath) return
            if (!path.extname(savePath)) savePath += path.extname(defaultPath)
            window.ipcRenderer.invoke("save-image", image, savePath)
        }
        
    }

    const reset = async () => {
        const newImages = await window.ipcRenderer.invoke("reset")
        if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
    }

    const previous = async () => {
        const previous = await window.ipcRenderer.invoke("previous")
        if (previous) {
            setImage(previous)
            window.ipcRenderer.invoke("update-original-images", previous)
            resetZoom()
            resetRotation()
            setBulk(false)
            setBulkFiles(null)
        }
    }

    const next = async () => {
        const next = await window.ipcRenderer.invoke("next")
        if (next) {
            setImage(next)
            window.ipcRenderer.invoke("update-original-images", next)
            resetZoom()
            resetRotation()
            setBulk(false)
            setBulkFiles(null)
        }
    }

    const resetZoom = () => {
        zoomRef?.current!.resetTransform(0)
    }

    const resetRotation = () => {
        setRotateDegrees(0)
    }

    const zoomIn = () => {
        zoomRef?.current!.zoomIn(0.5, 0)
    }

    const zoomOut = () => {
        zoomRef?.current!.zoomOut(0.5, 0)
    }

    const bulkProcess = async () => {
        const files = await window.ipcRenderer.invoke("select-image-files")
        if (!files.length) return
        setBulkFiles(files)
        setBulk(true)
    }

    const increaseBrushSize = () => {
        setBrushSize((prev: number) => {
            let newVal = prev + 1
            if (newVal > 100) newVal = 100
            return newVal
        })
    }

    const decreaseBrushSize = () => {
        setBrushSize((prev: number) => {
            let newVal = prev - 1
            if (newVal < 1) newVal = 1
            return newVal
        })
    }

    const draw = () => {
        if (drawing) {
            setErasing(!erasing)
        } else {
            setDrawing(true)
            resetZoom()
            window.ipcRenderer.invoke("trigger-accept-action", "draw")
        }
    }

    const clearDraw = () => {
        drawRef.current.clear()
    }

    const undoDraw = () => {
        drawRef.current.undo()
    }

    const invertDraw = async () => {
        const data = drawRef.current.getSaveData()
        const parsed = JSON.parse(data)
        let megaLineIdx = parsed.lines.findIndex((l: any) => l.brushRadius === parsed.width + parsed.height)
        if (megaLineIdx === -1) {
            parsed.lines.unshift({brushColor: "erase", brushRadius: parsed.width + parsed.height, 
            points: [{x: 0, y: 0}, {x: parsed.width, y: parsed.height}]})
            megaLineIdx = 0
        }
        for (let i = 0; i < parsed.lines.length; i++) {
            if (parsed.lines[i].brushColor === "erase") {
                parsed.lines[i].brushColor = brushColor
            } else {
                parsed.lines[i].brushColor = "erase"
            }
            if (parsed.lines[i].points[0]?.erase) {
                delete parsed.lines[i].points[0].erase
            }
        }
        drawRef.current.loadSaveData(JSON.stringify(parsed), true)
    }

    const saveDrawing = async () => {
        const layerURL = drawRef.current.getDataURL("png", false)

        const img = await functions.createImage(image)
        const imgCanvas = document.createElement("canvas")
        imgCanvas.width = img.width
        imgCanvas.height = img.height
        const imgCtx = imgCanvas.getContext("2d")!
        imgCtx.drawImage(img, 0, 0, imgCanvas.width, imgCanvas.height)

        const layer = await functions.createImage(layerURL)
        const layerCanvas = document.createElement("canvas")
        const layerCtx = layerCanvas.getContext("2d")!
        layerCanvas.width = imgCanvas.width
        layerCanvas.height = imgCanvas.height
        layerCtx.drawImage(layer, 0, 0, layerCanvas.width, layerCanvas.height)
        imgCtx.drawImage(layerCanvas, 0, 0, imgCanvas.width, imgCanvas.height)

        const outputURL = imgCanvas.toDataURL("image/png")
        const newImages = await window.ipcRenderer.invoke("append-history-state", outputURL)
        if (newImages) bulk ? setBulkFiles(newImages) : setImage(newImages[0])
    }

    return (
        <main className="photo-viewer" {...getRootProps()}>
            <div className={hover && !drawing ? "left-adjustment-bar visible" : "left-adjustment-bar"} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <BrightnessIcon className="adjustment-img" onClick={() => brightness()}/>
                <HueIcon className="adjustment-img" onClick={() => hue()}/>
                <TintIcon className="adjustment-img" onClick={() => tint()}/>
                <BlurIcon className="adjustment-img" onClick={() => blur()}/>
                <PreviousIcon className="adjustment-img" onClick={() => previous()}/>
                <PixelateIcon className="adjustment-img" onClick={() => pixelate()}/>
                <InvertIcon className="adjustment-img" onClick={() => invert()}/>
                <BinarizeIcon className="adjustment-img" onClick={() => binarize()}/>
                <CropIcon className="adjustment-img" onClick={() => toggleCrop()}/>
            </div>
            <div className={hover && !drawing ? "right-adjustment-bar visible" : "right-adjustment-bar"} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                <ResizeIcon className="adjustment-img" onClick={() => resize()}/>
                <RotateIcon className="adjustment-img" onClick={() => rotate()}/>
                <FlipXIcon className="adjustment-img" onClick={() => flipX()}/>
                <FlipYIcon className="adjustment-img" onClick={() => flipY()}/>
                <NextIcon className="adjustment-img" onClick={() => next()}/>
                <UndoIcon className="adjustment-img" onClick={() => undo()}/>
                <RedoIcon className="adjustment-img" onClick={() => redo()}/>
                <SaveIcon className="adjustment-img" onClick={() => save()}/>
                <ResetIcon className="adjustment-img" onClick={() => reset()}/>
            </div>
            <TransformWrapper ref={zoomRef} minScale={0.5} limitToBounds={false} minPositionX={-200} maxPositionX={200} minPositionY={-200} maxPositionY={200} onZoom={(ref) => setZoomScale(ref.state.scale)}
            onZoomStop={(ref) => setZoomScale(ref.state.scale)} panning={{allowLeftClickPan: !drawing, allowRightClickPan: false}} wheel={{step: 0.1}} pinch={{disabled: true}} zoomAnimation={{size: 0}} 
            alignmentAnimation={{disabled: true}} doubleClick={{mode: "reset", animationTime: 0}}>
                <TransformComponent>
                    <div className="rotate-photo-container" style={{transform: `rotate(${rotateDegrees}deg)`}}>
                        {bulk ? <BulkContainer files={bulkFiles}/> :
                        <div className="photo-container" onMouseDown={() => window.ipcRenderer.send("moveWindow")}>
                            {drawing ? <CanvasDraw ref={drawRef} className="draw-img" lazyRadius={0} brushRadius={brushSize} brushColor={brushColor} 
                            catenaryColor="rgba(0, 0, 0, 0)" hideGrid={true} canvasWidth={width} canvasHeight={height} imgSrc={image} erase={erasing} 
                            loadTimeOffset={0} eraseColor="#000000" zoom={zoomScale} style={{transform: `rotate(${-rotateDegrees}deg)`}}/> :
                            <ReactCrop className="photo" src={image} zoom={zoomScale} spin={rotateDegrees} crop={cropState as any} 
                            onChange={(crop: any, percentCrop: any) => setCropState(percentCrop as any)} disabled={!cropEnabled} keepSelection={true}/>}
                        </div>}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </main>
    )
}

export default PhotoViewer