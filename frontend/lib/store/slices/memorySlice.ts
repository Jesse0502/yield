import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { Memory } from "@/lib/api/types"
import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

interface MemoryState {
  memories: Memory[]
  loading: boolean
  adding: boolean
  error: string | null
  hasLoaded: boolean
  hasMore: boolean
  searchQuery: string
  page: number
}

const initialState: MemoryState = {
  memories: [],
  loading: false,
  adding: false,
  error: null,
  hasLoaded: false,
  hasMore: true,
  searchQuery: "",
  page: 1,
}

const LIMIT = 20

export const fetchMemories = createAsyncThunk(
  "memory/fetchMemories",
  async (
    { query = "", page = 1, reset = false }: { query?: string; page?: number; reset?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const offset = (page - 1) * LIMIT
      const response = await apiClient.get<any[]>(API_ENDPOINTS.MEMORIES, {
        params: {
          query: query || undefined,
          limit: LIMIT,
          offset: offset,
        },
      })
      return { data: response.data, reset, page }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch memories")
    }
  }
)

export const addMemory = createAsyncThunk(
  "memory/addMemory",
  async (content: string, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.post(API_ENDPOINTS.MEMORIES, { content })
      // Refresh memories to show the new one
      dispatch(fetchMemories({ query: "", page: 1, reset: true }))
      return null
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add memory")
    }
  }
)

export const deleteMemory = createAsyncThunk(
  "memory/deleteMemory",
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`${API_ENDPOINTS.MEMORIES}/${id}`)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete memory")
    }
  }
)

const memorySlice = createSlice({
  name: "memory",
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      // Reset pagination when search changes
      state.page = 1
      state.hasMore = true
      state.memories = []
      state.hasLoaded = false
    },
    resetMemories: (state) => {
      state.memories = []
      state.page = 1
      state.hasMore = true
      state.hasLoaded = false
      state.searchQuery = ""
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Memories
      .addCase(fetchMemories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMemories.fulfilled, (state, action) => {
        state.loading = false
        state.hasLoaded = true
        const { data, reset, page } = action.payload
        
        // Map backend data to frontend model
        const mappedMemories: Memory[] = data.map((item: any) => ({
          id: item.id,
          title: item.content.length > 50 ? item.content.substring(0, 50) + "..." : item.content,
          content: item.content,
          category: "reference", // Default category
          createdAt: new Date(item.created_at || Date.now()).toLocaleString(),
          tags: [], // Tags not yet supported in backend explicitly
          source: "manual", // Default for now
          metadata: item.metadata
        }))

        if (reset) {
          state.memories = mappedMemories
        } else {
          // Append only new ones to avoid duplicates if any race conditions
          const existingIds = new Set(state.memories.map(m => m.id))
          const uniqueNew = mappedMemories.filter(m => !existingIds.has(m.id))
          state.memories = [...state.memories, ...uniqueNew]
        }

        state.hasMore = data.length === LIMIT
        state.page = page
      })
      .addCase(fetchMemories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Add Memory
      .addCase(addMemory.pending, (state) => {
        state.adding = true
        state.error = null
      })
      .addCase(addMemory.fulfilled, (state) => {
        state.adding = false
      })
      .addCase(addMemory.rejected, (state, action) => {
        state.adding = false
        state.error = action.payload as string
      })
      // Delete Memory
      .addCase(deleteMemory.fulfilled, (state, action) => {
        state.memories = state.memories.filter((m) => m.id !== action.payload)
      })
  },
})

export const { setSearchQuery, resetMemories } = memorySlice.actions
export default memorySlice.reducer
