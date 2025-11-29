import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface UiState {
  activeNav: string
  sidebarOpen: boolean
  theme: "light" | "dark"
}

const initialState: UiState = {
  activeNav: "chat",
  sidebarOpen: false,
  theme: "dark",
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveNav: (state, action: PayloadAction<string>) => {
      state.activeNav = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload
    },
  },
})

export const { setActiveNav, toggleSidebar, setSidebarOpen, setTheme } = uiSlice.actions
export default uiSlice.reducer

