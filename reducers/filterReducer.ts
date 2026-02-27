import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const filterSlice = createSlice({
    name: "filter",
    initialState: {
        image: "",
        brightness: 100,
        contrast: 100,
        hue: 180,
        saturation: 100,
        lightness: 0,
        blur: 0,
        sharpen: 0,
        pixelate: 1
    },
    reducers: {
        setImage: (state, action) => {state.image = action.payload},
        setBrightness: (state, action) => {state.brightness = action.payload},
        setContrast: (state, action) => {state.contrast = action.payload},
        setHue: (state, action) => {state.hue = action.payload},
        setSaturation: (state, action) => {state.saturation = action.payload},
        setLightness: (state, action) => {state.lightness = action.payload},
        setBlur: (state, action) => {state.blur = action.payload},
        setSharpen: (state, action) => {state.sharpen = action.payload},
        setPixelate: (state, action) => {state.pixelate = action.payload}
    }   
})

const {
    setImage, setBrightness, setContrast, setHue, setSaturation, setLightness, setBlur, 
    setSharpen, setPixelate
} = filterSlice.actions

export const useFilterSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        image: selector((state) => state.filter.image),
        brightness: selector((state) => state.filter.brightness),
        contrast: selector((state) => state.filter.contrast),
        hue: selector((state) => state.filter.hue),
        saturation: selector((state) => state.filter.saturation),
        lightness: selector((state) => state.filter.lightness),
        blur: selector((state) => state.filter.blur),
        sharpen: selector((state) => state.filter.sharpen),
        pixelate: selector((state) => state.filter.pixelate)
    }
}

export const useFilterActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setImage: (state: string) => dispatch(setImage(state)),
        setBrightness: (state: number) => dispatch(setBrightness(state)),
        setContrast: (state: number) => dispatch(setContrast(state)),
        setHue: (state: number) => dispatch(setHue(state)),
        setSaturation: (state: number) => dispatch(setSaturation(state)),
        setLightness: (state: number) => dispatch(setLightness(state)),
        setBlur: (state: number) => dispatch(setBlur(state)),
        setSharpen: (state: number) => dispatch(setSharpen(state)),
        setPixelate: (state: number) => dispatch(setPixelate(state))
    }
}

export default filterSlice.reducer