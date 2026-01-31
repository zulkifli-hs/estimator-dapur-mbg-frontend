import { apiRequest, setAuthToken, type ApiResponse } from "./config"

export interface LoginCredentials {
  usernameOrEmail: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
}

export interface UserProfile {
  _id: string
  email: string
  admin?: boolean // Added optional admin field
  profile?: {
    name: string
    photo?: {
      url: string
      provider: string
    }
    phone: string
  }
}

export const login = async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiRequest<AuthResponse>("/auths/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })

  // Store the access token
  if (response.data.accessToken) {
    setAuthToken(response.data.accessToken)
  }

  return response
}

export const register = async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
  return apiRequest<AuthResponse>("/auths/register", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const refreshToken = async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
  return apiRequest<AuthResponse>("/auths/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  })
}

export const forgotPassword = async (email: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>("/auths/forget-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export const resetPassword = async (
  email: string,
  otp: string,
  password: string,
  rePassword: string,
): Promise<ApiResponse<any>> => {
  return apiRequest<any>("/auths/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, password, rePassword }),
  })
}

export const getProfile = async (): Promise<ApiResponse<UserProfile>> => {
  return apiRequest<UserProfile>("/auths/profiles", {
    method: "GET",
  })
}

export const updateProfile = async (data: {
  name: string
  photo?: { url: string; provider: string }
  phone: string
}): Promise<ApiResponse<UserProfile>> => {
  return apiRequest<UserProfile>("/auths/profiles", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}
