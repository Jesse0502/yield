import { store } from "./index"

/**
 * Root state type
 */
export type RootState = ReturnType<typeof store.getState>

/**
 * App dispatch type
 */
export type AppDispatch = typeof store.dispatch

