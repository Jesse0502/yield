import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { Insight, Notification } from "@/lib/api/types"
import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

interface InboxState {
  insights: Insight[]
  selectedInsight: string | null
  loading: boolean
  error: string | null
}

const initialState: InboxState = {
  insights: [],
  selectedInsight: null,
  loading: false,
  error: null,
}

export const fetchNotifications = createAsyncThunk(
  "inbox/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<Notification[]>(API_ENDPOINTS.NOTIFICATIONS)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch notifications")
    }
  }
)

export const deleteNotification = createAsyncThunk(
  "inbox/deleteNotification",
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`${API_ENDPOINTS.NOTIFICATIONS}/${id}`)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete notification")
    }
  }
)

const inboxSlice = createSlice({
  name: "inbox",
  initialState,
  reducers: {
    selectInsight: (state, action: PayloadAction<string | null>) => {
      state.selectedInsight = action.payload
    },
    setInsights: (state, action: PayloadAction<Insight[]>) => {
      state.insights = action.payload
    },
    resetInbox: (state) => {
      state.insights = []
      state.selectedInsight = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        // Map backend notifications to frontend insights
        state.insights = action.payload.map((notif) => ({
          id: notif.id,
          priority: "medium", // Default priority
          title: notif.type === "reminder" ? "Reminder" : "Notification",
          summary: notif.content,
          sender: "AI Assistant",
          timestamp: new Date(notif.created_at).toLocaleString(),
          isRead: notif.is_read
        }))
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Delete Notification
      .addCase(deleteNotification.pending, (state) => {
        // Optimistic UI updates often preferred, but keeping simple for now
        state.loading = true
        state.error = null
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading = false
        state.insights = state.insights.filter((insight) => insight.id !== action.payload)
        if (state.selectedInsight === action.payload) {
          state.selectedInsight = null
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { selectInsight, setInsights, resetInbox } = inboxSlice.actions
export default inboxSlice.reducer
