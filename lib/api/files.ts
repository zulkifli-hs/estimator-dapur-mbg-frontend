import { apiRequest, API_BASE_URL, getAuthToken, type ApiResponse } from "./config"

export interface ProjectFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploaded_by: string
  uploaded_at: string
}

export const getProjectFiles = async (projectId: string): Promise<ProjectFile[]> => {
  try {
    const response = await apiRequest<any>(`/projects/${projectId}/files`, {
      method: "GET",
    })

    // Handle different possible response structures
    if (response.data) {
      // If response has a list property (paginated)
      if (response.data.list && Array.isArray(response.data.list)) {
        return response.data.list
      }
      // If response.data is directly an array
      if (Array.isArray(response.data)) {
        return response.data
      }
    }

    // Return empty array if no valid data
    return []
  } catch (error) {
    console.error("[v0] Error fetching project files:", error)
    return []
  }
}

export const uploadFile = async (projectId: string, file: File, type: string): Promise<ProjectFile> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("type", type)

  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) throw new Error("Upload failed")
  return response.json()
}

export const deleteFile = async (projectId: string, fileId: string): Promise<void> => {
  return apiRequest<void>(`/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
  })
}

// Upload general photo
export const uploadPhoto = async (file: File): Promise<ApiResponse<{ url: string; provider: string }>> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/upload/photos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  return response.json()
}

// Get file URL for viewing/downloading
export const getFileUrl = (provider: string, url: string): string => {
  return `${API_BASE_URL}/public/${provider}/${encodeURIComponent(url)}`
}

export const uploadProjectFile = async (projectId: string, file: File, type: string): Promise<any> => {
  console.log("[v0] uploadProjectFile called:", {
    projectId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    type,
    endpoint: `${API_BASE_URL}/projects/${projectId}/${type}`,
  })

  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  console.log("[v0] Token available:", !!token)

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/${type}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  console.log("[v0] Upload response status:", response.status, response.ok)

  if (!response.ok) {
    const errorData = await response.json()
    console.error("[v0] Upload error details:", JSON.stringify(errorData, null, 2))

    // Extract the user-friendly error message
    const errorMessage = errorData.message?.user || errorData.message || "Upload failed"
    throw new Error(errorMessage)
  }

  const result = await response.json()
  console.log("[v0] Upload success:", result)
  return result
}

export const filesApi = {
  getByProject: async (projectId: string) => {
    try {
      const data = await getProjectFiles(projectId)
      return { success: true, data: Array.isArray(data) ? data : [] }
    } catch (error) {
      console.error("[v0] Error in filesApi.getByProject:", error)
      return { success: false, data: [] }
    }
  },
  upload: async (projectId: string, file: File, type: string) => {
    const data = await uploadFile(projectId, file, type)
    return { success: true, data }
  },
  delete: async (fileId: string, projectId?: string) => {
    if (projectId) {
      await deleteFile(projectId, fileId)
    }
    return { success: true }
  },
  uploadPhoto: async (file: File) => {
    const response = await uploadPhoto(file)
    return { success: response.code === 200, data: response.data }
  },
  getFileUrl,
  uploadProjectFile,
}
