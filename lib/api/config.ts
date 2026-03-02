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

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Basic Auth — required by the API gateway for every request
  const basicUser = process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME
  const basicPass = process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD
  if (basicUser && basicPass) {
    headers["Authorization"] = `Basic ${btoa(`${basicUser}:${basicPass}`)}`
  }

  // JWT Bearer token overrides Basic Auth once the user is logged in
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

  if (response.status === 401 || jsonResponse.code === 401) {
    // Only treat as session expiry if the user had an active token.
    // During login/register there is no token, so 401 means wrong credentials.
    if (token) {
      removeAuthToken()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new Error("Session expired. Please login again.")
    }
    // No token — fall through to the generic error handler below so the
    // login page can display a proper "Invalid credentials" message.
  }

  // Primary check: HTTP status. If the server says OK (2xx), trust it.
  // Secondary check: if HTTP says OK but the body explicitly carries an error code (>= 400), treat it as an error too.
  const bodyCodeIsError =
    response.ok &&
    jsonResponse.code !== undefined &&
    jsonResponse.code !== null &&
    jsonResponse.code >= 400

  if (!response.ok || bodyCodeIsError) {
    // Build a descriptive error message
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
  get: <T>(endpoint: string, _options?: { params?: Record<string, any> }) =>
    apiRequest<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "DELETE" }),
  getAuthToken,
  setAuthToken,
  removeAuthToken,
}
