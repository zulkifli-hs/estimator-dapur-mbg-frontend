import { apiRequest, type ApiResponse } from "./config"

export interface Folder {
  _id: string
  name: string
  files: Array<{
    name: string
    url: string
    provider: string
    createdBy: string
    _id: string
    createdAt: string
    updatedAt: string
  }>
  createdAt: string
  updatedAt: string
}

export const createFolder = async (projectId: string, name: string): Promise<ApiResponse<Folder>> => {
  return apiRequest<Folder>(`/projects/${projectId}/folder`, {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export const getFolders = async (
  projectId: string,
  params?: { page?: number; limit?: number },
): Promise<ApiResponse<{ folders: Folder[]; total: number }>> => {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())

  const queryString = queryParams.toString()
  return apiRequest<{ folders: Folder[]; total: number }>(
    `/projects/${projectId}/folder${queryString ? `?${queryString}` : ""}`,
    { method: "GET" },
  )
}

export const getFolder = async (projectId: string, folderId: string): Promise<ApiResponse<Folder>> => {
  return apiRequest<Folder>(`/projects/${projectId}/folder/${folderId}`, { method: "GET" })
}

export const deleteFolder = async (projectId: string, folderId: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/projects/${projectId}/folder/${folderId}`, { method: "DELETE" })
}

export const addFileToFolder = async (
  projectId: string,
  folderId: string,
  url: string,
  provider: string,
): Promise<ApiResponse<Folder>> => {
  return apiRequest<Folder>(`/projects/${projectId}/folder/${folderId}/add`, {
    method: "POST",
    body: JSON.stringify({ url, provider }),
  })
}

export const deleteFileFromFolder = async (
  projectId: string,
  folderId: string,
  indexes: number[],
): Promise<ApiResponse<Folder>> => {
  return apiRequest<Folder>(`/projects/${projectId}/folder/${folderId}/delete`, {
    method: "POST",
    body: JSON.stringify({ indexes }),
  })
}

export const foldersApi = {
  getByProject: async (projectId: string, params?: { page?: number; limit?: number }) => {
    try {
      const response = await getFolders(projectId, params)
      return { success: response.code === 200, data: response.data.folders || response.data }
    } catch (error: any) {
      if (error.code === 404) {
        return { success: true, data: [] }
      }
      throw error
    }
  },
  create: async (data: { projectId: string; name: string }) => {
    const response = await createFolder(data.projectId, data.name)
    return { success: response.code === 200 || response.code === 201, data: response.data }
  },
  delete: async (folderId: string, projectId?: string) => {
    if (projectId) {
      const response = await deleteFolder(projectId, folderId)
      return { success: response.code === 200 }
    }
    return { success: false }
  },
  getFolder: async (projectId: string, folderId: string) => {
    const response = await getFolder(projectId, folderId)
    return { success: response.code === 200, data: response.data }
  },
  addFile: async (projectId: string, folderId: string, url: string, provider: string) => {
    const response = await addFileToFolder(projectId, folderId, url, provider)
    return { success: response.code === 200 || response.code === 201, data: response.data }
  },
  deleteFile: async (projectId: string, folderId: string, indexes: number[]) => {
    const response = await deleteFileFromFolder(projectId, folderId, indexes)
    return { success: response.code === 200 }
  },
}
