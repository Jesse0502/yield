import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { SERVER_URL } from "@/lib/config"

/**
 * Axios instance configured with base URL from environment
 */
export const apiClient = axios.create({
  baseURL: SERVER_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
})

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available in localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.status, error.response.data)
      
      // Handle 401 Unauthorized - optional: redirect to login or clear token
      if (error.response.status === 401) {
        // e.g., localStorage.removeItem("auth_token"); window.location.href = "/login";
      }
    } else if (error.request) {
      // Request made but no response received
      console.error("Network Error:", error.message)
    } else {
      // Something else happened
      console.error("Error:", error.message)
    }
    return Promise.reject(error)
  }
)
