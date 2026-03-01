/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Pic Viewer - A cute image viewer ❤                        *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {configureStore} from "@reduxjs/toolkit"
import themeReducer, {useThemeSelector, useThemeActions} from "./reducers/themeReducer"
import activeReducer, {useActiveSelector, useActiveActions} from "./reducers/activeReducer"
import drawingReducer, {useDrawingSelector, useDrawingActions}  from "./reducers/drawingReducer"
import filterReducer, {useFilterSelector, useFilterActions}  from "./reducers/filterReducer"

const store = configureStore({
    reducer: {
        theme: themeReducer,
        active: activeReducer,
        drawing: drawingReducer,
        filter: filterReducer
    },
})

export type StoreState = ReturnType<typeof store.getState>
export type StoreDispatch = typeof store.dispatch

export {
    useThemeSelector, useThemeActions,
    useActiveSelector, useActiveActions,
    useDrawingSelector, useDrawingActions,
    useFilterSelector, useFilterActions
}

export default store