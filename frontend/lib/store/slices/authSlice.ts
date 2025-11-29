import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  message: string | null
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("auth_token") : null,
  loading: false,
  error: null,
  message: null,
}

// Helper to save initial memory
const saveInitialMemory = async (name: string, token: string) => {
  try {
    await apiClient.post(
      API_ENDPOINTS.MEMORIES, 
      { content: `The user's full name is ${name}.` },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return true
  } catch (memError) {
    console.error("Failed to save initial memory:", memError)
    return false
  }
}

export const loginWithPassword = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if we need to store initial memory (handled on login for delayed email verifications)
      if (data.session && data.user) {
        const metadata = data.user.user_metadata || {}
        if (!metadata.initial_memory_created && metadata.full_name) {
          const saved = await saveInitialMemory(metadata.full_name, data.session.access_token)
          if (saved) {
            await supabase.auth.updateUser({
              data: { initial_memory_created: true }
            })
          }
        }
      }

      return { user: data.user, session: data.session }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const registerWithPassword = createAsyncThunk(
  "auth/register",
  async (
    { email, password, name }: { email: string; password: string; name: string },
    { rejectWithValue }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            // Don't set initial_memory_created here, wait until we actually save it
          },
        },
      })

      if (error) throw error

      // Store initial user metadata as memory if session is available (no email confirmation required)
      if (data.session) {
        const saved = await saveInitialMemory(name, data.session.access_token)
        if (saved) {
          await supabase.auth.updateUser({
            data: { initial_memory_created: true }
          })
        }
      }

      return { user: data.user, session: data.session }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const logout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return null
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<{ user: User; token: string | null }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      if (action.payload.token) {
        localStorage.setItem("auth_token", action.payload.token)
      }
    },
    clearSession: (state) => {
      state.user = null
      state.token = null
      localStorage.removeItem("auth_token")
    },
    clearError: (state) => {
      state.error = null
      state.message = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginWithPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(loginWithPassword.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        if (action.payload.session) {
          state.token = action.payload.session.access_token
          localStorage.setItem("auth_token", action.payload.session.access_token)
        }
      })
      .addCase(loginWithPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Register
      .addCase(registerWithPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(registerWithPassword.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.session) {
          state.user = action.payload.user
          state.token = action.payload.session.access_token
          localStorage.setItem("auth_token", action.payload.session.access_token)
        } else {
          // If no session (email confirmation required), just set message
          state.message = "Please check your email to confirm your account."
        }
      })
      .addCase(registerWithPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        localStorage.removeItem("auth_token")
      })
  },
})

export const { setSession, clearSession, clearError } = authSlice.actions
export default authSlice.reducer
