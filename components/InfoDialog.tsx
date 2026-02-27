import React, {useEffect} from "react"
import functions from "../structures/functions"
import "./styles/dialog.less"

const InfoDialog: React.FunctionComponent = () => {
    useEffect(() => {
        const showinfoDialog = async (event: any, coords: {x: number, y: number}) => {
            const images = await window.ipcRenderer.invoke("get-original-images")
            if (images.length > 1) {
                let image = functions.imageAtCursor(coords)
                if (window.platform !== "windows") image = image.replace("file:///", "/")
                const i = images.findIndex((img: string) => functions.pathEqual(img, decodeURIComponent(image)))
                if (i === -1) return
                window.ipcRenderer.invoke("show-info-dialog", i)
            } else {
                window.ipcRenderer.invoke("show-info-dialog", 0)
            }
        }
        window.ipcRenderer.on("show-info-dialog", showinfoDialog)
        return () => {
            window.ipcRenderer.removeListener("show-info-dialog", showinfoDialog)
        }
    }, [])

    return null
}

export default InfoDialog