import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const filterSlice = createSlice({
    name: "filter",
    initialState: {
        image: "",
        pixelate: 1
    },
    reducers: {
        setImage: (state, action) => {state.image = action.payload},
        setPixelate: (state, action) => {state.pixelate = action.payload}
    }   
})

const {
    setImage, setPixelate
} = filterSlice.actions

export const useFilterSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        image: selector((state) => state.filter.image),
        pixelate: selector((state) => state.filter.pixelate)
    }
}

export const useFilterActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setImage: (state: string) => dispatch(setImage(state)),
        setPixelate: (state: number) => dispatch(setPixelate(state))
    }
}

export default filterSlice.reducer