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

export const BASIC_AUTH_USERNAME = process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME || ""
export const BASIC_AUTH_PASSWORD = process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD || ""

// API request helper with auth
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAuthToken()

  const headers: HeadersInit = {
    ...options.headers,
  }

  if (BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD) {
    const basicAuthCredentials = btoa(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`)
    headers["Authorization"] = `Basic ${basicAuthCredentials}`
  }

  // Add Bearer token if available (overrides Basic Auth)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  // Add Content-Type for JSON requests (not for FormData)
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json"
  }

  console.log("[v0] API Request:", {
    endpoint,
    method: options.method,
  })

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const jsonResponse = await response.json().catch(() => ({
    code: response.status,
    message: { dev: { name: "Error", problems: [] }, user: "Request failed" },
    data: null,
  }))

  console.log("[v0] API Response:", {
    status: response.status,
    ok: response.ok,
    jsonResponse,
  })

  if (response.status === 401 || jsonResponse.code === 401) {
    console.log("[v0] 401 Unauthorized - clearing auth and redirecting to login")
    removeAuthToken()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Session expired. Please login again.")
  }

  // Accept both 200 (OK) and 201 (Created) as successful responses
  if (!response.ok || (jsonResponse.code !== 200 && jsonResponse.code !== 201)) {
    const errorDetails = {
      endpoint,
      method: options.method,
      status: response.status,
      responseOk: response.ok,
      code: jsonResponse.code,
      message: jsonResponse.message,
      devProblems: jsonResponse.message?.dev?.problems || [],
    }
    console.error("[v0] API Error Details:", JSON.stringify(errorDetails, null, 2))

    // Build a more descriptive error message
    let errorMessage = jsonResponse.message?.user || `HTTP ${response.status}`
    if (response.status === 404) {
      errorMessage = `Endpoint tidak ditemukan (404): ${endpoint}. Pastikan endpoint API sudah tersedia di backend.`
    }

    throw new Error(errorMessage)
  }

  return jsonResponse
}

export const apiClient = {
  request: apiRequest,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
}
