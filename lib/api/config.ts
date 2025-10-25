// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.gema-interior.com"

// Get auth token from localStorage (client-side only)
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

// Set auth token to localStorage
export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
  }
}

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
  }
}

export interface ApiResponse<T> {
  code: number
  message: {
    dev: {
      name: string
      problems: any[]
    }
    user: string
  }
  data: T
}

// API request helper with auth
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken()

  const headers: HeadersInit = {
    ...options.headers,
  }

  // Add auth token if available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  // Add Content-Type for JSON requests (not for FormData)
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json"
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const jsonResponse = await response.json().catch(() => ({
    code: response.status,
    message: { dev: { name: "Error", problems: [] }, user: "Request failed" },
    data: null,
  }))

  if (!response.ok || jsonResponse.code !== 200) {
    throw new Error(jsonResponse.message?.user || `HTTP ${response.status}`)
  }

  return jsonResponse
}

export const apiClient = {
  request: apiRequest,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
}
