/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {createSlice} from "@reduxjs/toolkit"
import {useSelector, useDispatch} from "react-redux"
import type {StoreState, StoreDispatch} from "../store"

const activeSlice = createSlice({
    name: "active",
    initialState: {
        hover: true,
        imageDrag: true,
        infoDialogActive: false,
        effectActive: false
    },
    reducers: {
        setHover: (state, action) => {state.hover = action.payload},
        setImageDrag: (state, action) => {state.imageDrag = action.payload},
        setInfoDialogActive: (state, action) => {state.infoDialogActive = action.payload},
        setEffectActive: (state, action) => {state.effectActive = action.payload}
    }    
})

const {
    setHover, setImageDrag, setInfoDialogActive, setEffectActive
} = activeSlice.actions

export const useActiveSelector = () => {
    const selector = useSelector.withTypes<StoreState>()
    return {
        hover: selector((state) => state.active.hover),
        imageDrag: selector((state) => state.active.imageDrag),
        infoDialogActive: selector((state) => state.active.infoDialogActive),
        effectActive: selector((state) => state.active.effectActive)
    }
}

export const useActiveActions = () => {
    const dispatch = useDispatch.withTypes<StoreDispatch>()()
    return {
        setHover: (state: boolean) => dispatch(setHover(state)),
        setImageDrag: (state: boolean) => dispatch(setImageDrag(state)),
        setInfoDialogActive: (state: boolean) => dispatch(setInfoDialogActive(state)),
        setEffectActive: (state: boolean) => dispatch(setEffectActive(state))
    }
}

export default activeSlice.reducer