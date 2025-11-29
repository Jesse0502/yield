import { configureStore } from "@reduxjs/toolkit"
import chatReducer from "./slices/chatSlice"
import inboxReducer from "./slices/inboxSlice"
import memoryReducer from "./slices/memorySlice"
import filesReducer from "./slices/filesSlice"
import uiReducer from "./slices/uiSlice"
import authReducer from "./slices/authSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    inbox: inboxReducer,
    memory: memoryReducer,
    files: filesReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["chat/sendMessage/pending"],
      },
    }),
})

// Types are exported from types.ts

