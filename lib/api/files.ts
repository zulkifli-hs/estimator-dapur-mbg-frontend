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
  return apiRequest<ProjectFile[]>(`/projects/${projectId}/files`, {
    method: "GET",
  })
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

export const filesApi = {
  getByProject: async (projectId: string) => {
    const data = await getProjectFiles(projectId)
    return { success: true, data }
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
}
