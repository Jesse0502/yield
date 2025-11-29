import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { streamChatResponse, ChatMessage } from "@/lib/api/streaming"
import { formatError } from "@/lib/utils/errorHandler"
import { supabase } from "@/lib/supabase"
import { RootState } from "../types"

export interface Message {
  id: string
  role: "user" | "ai"
  content: string
  timestamp: string
  createdAt?: string
}

interface ChatState {
  messages: Message[]
  inputValue: string
  loading: boolean
  error: string | null
  streaming: boolean
  currentStreamId: string | null
  historyLoading: boolean
  hasMoreHistory: boolean
  historyCursor: string | null
  initialHistoryLoaded: boolean
}

interface FetchHistoryResult {
  messages: Message[]
  fetchedOlder: boolean
  hasMore: boolean
  cursor: string | null
}

const initialState: ChatState = {
  messages: [],
  inputValue: "",
  loading: false,
  error: null,
  streaming: false,
  currentStreamId: null,
  historyLoading: false,
  hasMoreHistory: true,
  historyCursor: null,
  initialHistoryLoaded: false,
}

const CHAT_PAGE_SIZE = 20

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

const mapRowToMessage = (row: any): Message => ({
  id: row.id?.toString() ?? `remote-${Date.now()}`,
  role: row.message?.type === "human" ? "user" : "ai",
  content: row.message?.content || "",
  timestamp: formatTimestamp(new Date(row.created_at)),
  createdAt: row.created_at,
})

/**
 * Async thunk for fetching chat history
 */
export const fetchChatHistory = createAsyncThunk<
  FetchHistoryResult,
  { before?: string } | undefined,
  { state: RootState; rejectValue: string }
>(
  "chat/fetchHistory",
  async ({ before } = {}, { rejectWithValue, getState }) => {
    const state = getState() as RootState
    const userId = state.auth.user?.id

    if (!userId) {
      return rejectWithValue("User not authenticated")
    }

    try {
      let query = supabase
        .from("chat_history")
        .select("id, message, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(CHAT_PAGE_SIZE)

      if (before) {
        query = query.lt("created_at", before)
      }

      const { data, error } = await query

      if (error) throw error

      const mapped = (data || []).map(mapRowToMessage).reverse()

      const cursor =
        data && data.length > 0 ? data[data.length - 1].created_at : before ?? null

      return {
        messages: mapped,
        fetchedOlder: Boolean(before),
        hasMore: (data || []).length === CHAT_PAGE_SIZE,
        cursor,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return rejectWithValue(formatError(errorMessage))
    }
  }
)

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (message: string, { dispatch, rejectWithValue, getState }) => {
    const state = getState() as RootState
    const userId = state.auth.user?.id

    if (!userId) {
      return rejectWithValue("User not authenticated")
    }

    const now = new Date()
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: formatTimestamp(now),
      createdAt: now.toISOString(),
    }

    // 1. Add user message to Redux immediately
    dispatch(addMessage(userMessage))

    // 2. Save user message to Supabase
    try {
      await supabase.from("chat_history").insert({
        user_id: userId,
        message: { type: "human", content: message },
      })
    } catch (error) {
      console.error("Failed to save user message:", error)
      // Continue anyway, just history might be out of sync
    }

    const aiMessageId = `ai-${Date.now() + 1}`
    let accumulatedContent = ""

    // 3. Prepare Context (Last 20 messages from Redux, inclusive of the new one)
    // Note: We map 'ai' role to 'assistant' for the API
    const currentMessages = state.chat.messages
    // Add the new user message which hasn't been committed to state yet in this thunk scope?
    // Actually dispatch(addMessage) updates the store synchronously? No, reducers run after action.
    // But we can just append it manually.
    
    const contextMessages = [...currentMessages, userMessage].slice(-20).map(msg => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    }))

    try {
      return await new Promise<Message>((resolve, reject) => {
        streamChatResponse(
          contextMessages,
          (chunk: string) => {
            accumulatedContent += chunk
            dispatch(addStreamingChunk({ id: aiMessageId, content: accumulatedContent }))
          },
          (error: string) => {
            dispatch(setError(formatError(error)))
            dispatch(setStreaming(false))
            reject(new Error(error))
          },
          async () => {
            const finalContent = accumulatedContent.trim()
            
            // 4. Save AI response to Supabase
            try {
              await supabase.from("chat_history").insert({
                user_id: userId,
                message: { type: "ai", content: finalContent },
              })
            } catch (error) {
              console.error("Failed to save AI message:", error)
            }

            const aiMessage: Message = {
              id: aiMessageId,
              role: "ai",
              content: finalContent,
              timestamp: formatTimestamp(new Date()),
              createdAt: new Date().toISOString(),
            }
            dispatch(setStreaming(false))
            resolve(aiMessage)
          }
        )
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return rejectWithValue(formatError(errorMessage))
    }
  }
)

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },
    setInputValue: (state, action: PayloadAction<string>) => {
      state.inputValue = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    },
    addStreamingChunk: (state, action: PayloadAction<{ id: string; content: string }>) => {
      const { id, content } = action.payload
      const existingIndex = state.messages.findIndex((msg) => msg.id === id)
      
      if (existingIndex >= 0) {
        state.messages[existingIndex].content = content
      } else {
        state.messages.push({
          id,
          role: "ai",
          content,
          timestamp: formatTimestamp(new Date()),
          createdAt: new Date().toISOString(),
        })
      }
      state.streaming = true
      state.currentStreamId = id
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.streaming = action.payload
      if (!action.payload) {
        state.currentStreamId = null
      }
    },
    resetError: (state) => {
      state.error = null
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
        state.messages = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatHistory.pending, (state) => {
        state.historyLoading = true
        state.error = null
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.historyLoading = false
        const { messages, fetchedOlder, hasMore, cursor } = action.payload

        state.hasMoreHistory = hasMore
        state.historyCursor = cursor

        if (fetchedOlder) {
          state.messages = [...messages, ...state.messages]
        } else {
          state.messages = messages.length > 0 ? messages : state.messages
          state.initialHistoryLoaded = true
        }
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.historyLoading = false
        state.error = (action.payload as string) || "Failed to fetch history"
      })
      .addCase(sendMessage.pending, (state) => {
        state.loading = true
        state.error = null
        state.streaming = true
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false
        state.streaming = false
        state.currentStreamId = null
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false
        state.streaming = false
        state.currentStreamId = null
        state.error = action.payload as string || "Failed to send message"
      })
  },
})

export const {
  addMessage,
  setInputValue,
  clearMessages,
  addStreamingChunk,
  setStreaming,
  resetError,
  setError,
  setMessages
} = chatSlice.actions

export default chatSlice.reducer
