import {configureStore} from "@reduxjs/toolkit"
import themeReducer, {useThemeSelector, useThemeActions} from "./reducers/themeReducer"
import activeReducer, {useActiveSelector, useActiveActions} from "./reducers/activeReducer"
import drawingReducer, {useDrawingSelector, useDrawingActions}  from "./reducers/drawingReducer"

const store = configureStore({
    reducer: {
        theme: themeReducer,
        active: activeReducer,
        drawing: drawingReducer
    },
})

export type StoreState = ReturnType<typeof store.getState>
export type StoreDispatch = typeof store.dispatch

export {
    useThemeSelector, useThemeActions,
    useActiveSelector, useActiveActions,
    useDrawingSelector, useDrawingActions
}

export default store