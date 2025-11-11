import { API_BASE_URL, getAuthToken, BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD } from "./config"

export interface UploadResponse {
  url: string
  provider: string
}

export const uploadPhoto = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const headers: HeadersInit = {}

  if (BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD) {
    const basicAuthCredentials = btoa(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`)
    headers["Authorization"] = `Basic ${basicAuthCredentials}`
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/upload/photos`, {
    method: "POST",
    headers,
    body: formData,
  })

  const jsonResponse = await response.json()

  if (!response.ok || jsonResponse.code !== 200) {
    throw new Error(jsonResponse.message?.user || "Upload failed")
  }

  return jsonResponse.data
}

export const uploadApi = {
  uploadPhoto,
}
