/**
 * Utility functions for handling Server-Sent Events (SSE) streaming
 */

export interface StreamChunk {
  data: string
  done: boolean
  error?: string
}

export interface ChatMessage {
  role: string
  content: string
}

/**
 * Parse SSE data chunk
 */
export function parseSSEChunk(chunk: string): StreamChunk | null {
  // Handle multiple "data: " prefixes (in case of nested or malformed data)
  let data = chunk.trim()
  
  // Remove all "data: " prefixes
  while (data.startsWith("data:")) {
    data = data.substring(5).trim()
  }

  // Check for special signals
  if (data === "[DONE]") {
    return { data: "", done: true }
  }

  if (data.startsWith("[ERROR]:")) {
    const errorMessage = data.replace("[ERROR]:", "").trim()
    return { data: "", done: true, error: errorMessage }
  }

  return { data, done: false }
}

/**
 * Stream chat response using Server-Sent Events
 */
export async function streamChatResponse(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  onError?: (error: string) => void,
  onComplete?: () => void
): Promise<void> {
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000"
  
  // Get auth token
  const token = localStorage.getItem("auth_token")
  
  try {
    const response = await fetch(`${SERVER_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ messages }),
    })


    if (!response.ok) {
      if (response.status === 401) {
        // Force redirect to login on auth error
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        throw new Error("Session expired. Please login again.")
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error("Response body is null")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.trim()) {
          const chunk = parseSSEChunk(line)
          if (chunk) {
            if (chunk.error) {
              onError?.(chunk.error)
              return
            }
            if (chunk.done) {
              onComplete?.()
              return
            }
            if (chunk.data) {
              // Preserve spacing by adding space if needed
              onChunk(chunk.data + " ")
            }
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      const chunk = parseSSEChunk(buffer)
      if (chunk && !chunk.done && chunk.data) {
        onChunk(chunk.data + " ")
      }
    }

    onComplete?.()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    onError?.(errorMessage)
  }
}
