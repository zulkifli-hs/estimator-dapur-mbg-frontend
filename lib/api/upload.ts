import { API_BASE_URL, BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD } from "./config"

export interface UploadResponse {
  url: string
  provider: string
}

export const uploadPhoto = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append("file", file)

  const headers: HeadersInit = {}

  if (BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD) {
    const basicAuthCredentials = btoa(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`)
    headers["Authorization"] = `Basic ${basicAuthCredentials}`
  } else {
    throw new Error("Basic Auth credentials not configured")
  }

  console.log("[v0] Uploading photo to:", `${API_BASE_URL}/upload/photos`)
  console.log("[v0] Has auth header:", !!headers["Authorization"])

  const response = await fetch(`${API_BASE_URL}/upload/photos`, {
    method: "POST",
    headers,
    body: formData,
  })

  console.log("[v0] Upload response status:", response.status, response.ok)

  const jsonResponse = await response.json()
  console.log("[v0] Upload response data:", JSON.stringify(jsonResponse, null, 2))

  if (!response.ok || (jsonResponse.code !== 200 && jsonResponse.code !== 201)) {
    const errorMsg = jsonResponse.message?.user || jsonResponse.message || "Upload failed"
    console.error("[v0] Upload error:", errorMsg)
    throw new Error(errorMsg)
  }

  return jsonResponse.data
}

export const uploadApi = {
  uploadPhoto,
}
