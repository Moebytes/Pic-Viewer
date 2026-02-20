import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const drawingSlice = createSlice({
    name: "drawing",
    initialState: {
        drawing: false,
        erasing: false,
        brushColor: "#2f6df5"
    },
    reducers: {
        setDrawing: (state, action) => {state.drawing = action.payload},
        setErasing: (state, action) => {state.erasing = action.payload},
        setBrushColor: (state, action) => {state.brushColor = action.payload}
    }    
})

const {
    setDrawing, setErasing, setBrushColor
} = drawingSlice.actions

export const useDrawingSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        drawing: selector((state) => state.drawing.drawing),
        erasing: selector((state) => state.drawing.erasing),
        brushColor: selector((state) => state.drawing.brushColor)
    }
}

export const useDrawingActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setDrawing: (state: boolean) => dispatch(setDrawing(state)),
        setErasing: (state: boolean) => dispatch(setErasing(state)),
        setBrushColor: (state: string) => dispatch(setBrushColor(state))
    }
}

export default drawingSlice.reducer