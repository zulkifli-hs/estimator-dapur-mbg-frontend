import { API_BASE_URL, BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD } from "./config"

export interface UploadResponse {
  url: string
  provider: string
}

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to create image blob"))
        }
      },
      type,
      quality,
    )
  })
}

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Failed to load image for compression"))
    }

    image.src = objectUrl
  })
}

const compressImageIfNeeded = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/") || file.size <= MAX_IMAGE_SIZE_BYTES) {
    return file
  }

  if (typeof window === "undefined") {
    return file
  }

  try {
    const image = await loadImageFromFile(file)

    let width = image.width
    let height = image.height
    const maxDimension = 1920

    if (width > maxDimension || height > maxDimension) {
      const scale = Math.min(maxDimension / width, maxDimension / height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) {
      return file
    }

    canvas.width = width
    canvas.height = height
    context.drawImage(image, 0, 0, width, height)

    const preferredType = file.type === "image/webp" ? "image/webp" : "image/jpeg"

    for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5]) {
      const blob = await canvasToBlob(canvas, preferredType, quality)
      if (blob.size <= MAX_IMAGE_SIZE_BYTES) {
        return new File([blob], file.name, { type: preferredType, lastModified: Date.now() })
      }
    }

    const fallbackBlob = await canvasToBlob(canvas, preferredType, 0.5)
    if (fallbackBlob.size < file.size) {
      return new File([fallbackBlob], file.name, { type: preferredType, lastModified: Date.now() })
    }

    return file
  } catch {
    return file
  }
}

export const uploadPhoto = async (file: File): Promise<UploadResponse> => {
  const processedFile = await compressImageIfNeeded(file)
  const formData = new FormData()
  formData.append("file", processedFile)

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
  const processedFile = await compressImageIfNeeded(file)
  const formData = new FormData()
  formData.append("file", processedFile)

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
