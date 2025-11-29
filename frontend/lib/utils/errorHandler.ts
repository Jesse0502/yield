import { AxiosError } from "axios"
import { ApiError } from "@/lib/api/types"

/**
 * Format error for Redux state
 */
export function formatError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any
      return data?.message || data?.detail || `Server error: ${error.response.status}`
    } else if (error.request) {
      // Request made but no response received
      return "Network error: Unable to reach server"
    }
    return error.message || "An unknown error occurred"
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unknown error occurred"
}

/**
 * Create ApiError object from error
 */
export function createApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    return {
      message: formatError(error),
      status: error.response?.status,
      code: error.code,
    }
  }

  return {
    message: formatError(error),
  }
}

