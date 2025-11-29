import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { FileItem } from "@/lib/api/types"
import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

interface FilesState {
  files: FileItem[]
  uploadProgress: number
  loading: boolean
  error: string | null
}

const initialState: FilesState = {
  files: [],
  uploadProgress: 0,
  loading: false,
  error: null,
}

export const uploadFile = createAsyncThunk(
  "files/uploadFile",
  async (file: File, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await apiClient.post(
        API_ENDPOINTS.FILES + "/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              dispatch(setUploadProgress(progress))
            }
          },
        }
      )

      // Build a simple local FileItem record for UI display
      const now = new Date().toLocaleString()
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      let type: FileItem["type"] = "other"
      if (ext === "pdf") type = "pdf"
      else if (["doc", "docx", "md", "txt"].includes(ext)) type = "document"
      else if (["xls", "xlsx", "csv"].includes(ext)) type = "spreadsheet"
      else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) type = "image"

      const item: FileItem = {
        id: Date.now(), // local ID for UI; backend doesn't manage list yet
        name: file.name,
        type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedBy: "You",
        uploadedAt: now,
        tags: [],
      }

      dispatch(addFileLocal(item))
      dispatch(setUploadProgress(0))

      return response.data
    } catch (error: any) {
      dispatch(setUploadProgress(0))
      return rejectWithValue(error.message || "Failed to upload file")
    }
  }
)

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload
    },
    resetError: (state) => {
      state.error = null
    },
    // Temporary reducer to add a file locally for UI testing if needed,
    // though we are removing fake data/api calls.
    addFileLocal: (state, action: PayloadAction<FileItem>) => {
      state.files.push(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.loading = true
        state.error = null
        state.uploadProgress = 0
      })
      .addCase(uploadFile.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setUploadProgress, resetError, addFileLocal } = filesSlice.actions
export default filesSlice.reducer
