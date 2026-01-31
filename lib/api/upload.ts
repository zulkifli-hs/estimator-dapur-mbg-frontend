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

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers,
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }

  const jsonResponse = await response.json()

  if (jsonResponse.code !== 200 && jsonResponse.code !== 201) {
    const errorMsg = jsonResponse.message?.user || jsonResponse.message || "Upload failed"
    throw new Error(errorMsg)
  }

  return jsonResponse.data
}

export const uploadFile = async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append("file", file)

  const headers: HeadersInit = {}

  if (BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD) {
    const basicAuthCredentials = btoa(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`)
    headers["Authorization"] = `Basic ${basicAuthCredentials}`
  } else {
    throw new Error("Basic Auth credentials not configured")
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          onProgress(progress)
        }
      })
    }

    xhr.addEventListener("load", () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const jsonResponse = JSON.parse(xhr.responseText)
          if (jsonResponse.code === 200 || jsonResponse.code === 201) {
            resolve(jsonResponse.data)
          } else {
            const errorMsg = jsonResponse.message?.user || jsonResponse.message || "Upload failed"
            reject(new Error(errorMsg))
          }
        } catch (error) {
          reject(new Error("Failed to parse upload response"))
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"))
    })

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"))
    })

    xhr.open("POST", `${API_BASE_URL}/upload`)

    // Set auth header
    if (headers["Authorization"]) {
      xhr.setRequestHeader("Authorization", headers["Authorization"])
    }

    xhr.send(formData)
  })
}

export const uploadApi = {
  uploadPhoto,
  uploadFile, // Export new uploadFile function
}
