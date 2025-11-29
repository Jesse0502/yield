/**
 * TypeScript types for API requests and responses
 */

// Chat API Types
export interface ChatRequest {
  message: string
}

export interface ChatResponse {
  response: string
}

// Notification API Types (Backend)
export interface Notification {
  id: string
  user_id: string
  type: string
  content: string
  is_read: boolean
  created_at: string
}

// Inbox API Types (Frontend View)
export interface Insight {
  id: string
  priority: "high" | "medium" | "low"
  title: string
  summary: string
  sender?: string
  timestamp?: string
  isRead?: boolean
}

// Memory API Types
export type MemoryCategory = "chat" | "file" | "insight" | "task" | "reference" | "idea"

export type MemorySource = "chat" | "file" | "manual"

export interface Memory {
  id: string
  title: string
  content: string
  category: MemoryCategory
  createdAt: string
  tags: string[]
  source: MemorySource
  metadata?: Record<string, unknown>
}

// File API Types
export interface FileItem {
  id: number
  name: string
  type: "pdf" | "document" | "spreadsheet" | "image" | "other"
  size: string
  uploadedBy: string
  uploadedAt: string
  tags: string[]
}

// Global Search Types
export interface MemorySearchResult {
  id: string
  content: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface FileSearchResult {
  id: string
  fileId: string
  fileName: string
  storagePath?: string
  content: string
  createdAt: string
  chunkIndex?: number
}

export interface ChatSearchResult {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  messageId?: string  // For deep linking to specific message
}

export interface SmartInboxSearchResult {
  id: string
  type: string
  content: string
  isRead: boolean
  createdAt: string
  notificationId?: string  // For deep linking to specific notification
}

export interface GlobalSearchResponse {
  query: string
  results: {
    memories: MemorySearchResult[]
    files: FileSearchResult[]
    smartInbox: SmartInboxSearchResult[]
    chats: ChatSearchResult[]
  }
}

// Error Types
export interface ApiError {
  message: string
  status?: number
  code?: string
}
