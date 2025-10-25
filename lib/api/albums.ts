import { apiRequest, type ApiResponse } from "./config"

export interface Album {
  _id: string
  name: string
  photos: Array<{
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

export const createAlbum = async (projectId: string, name: string): Promise<ApiResponse<Album>> => {
  return apiRequest<Album>(`/projects/${projectId}/album`, {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export const getAlbums = async (
  projectId: string,
  params?: { page?: number; limit?: number },
): Promise<ApiResponse<{ albums: Album[]; total: number }>> => {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())

  const queryString = queryParams.toString()
  return apiRequest<{ albums: Album[]; total: number }>(
    `/projects/${projectId}/album${queryString ? `?${queryString}` : ""}`,
    { method: "GET" },
  )
}

export const getAlbum = async (projectId: string, albumId: string): Promise<ApiResponse<Album>> => {
  return apiRequest<Album>(`/projects/${projectId}/album/${albumId}`, { method: "GET" })
}

export const deleteAlbum = async (projectId: string, albumId: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/projects/${projectId}/album/${albumId}`, { method: "DELETE" })
}

export const bulkDeleteAlbums = async (projectId: string, albumIds: string[]): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/projects/${projectId}/album/delete`, {
    method: "POST",
    body: JSON.stringify({ _ids: albumIds }),
  })
}

export const addPhotoToAlbum = async (
  projectId: string,
  albumId: string,
  url: string,
  provider: string,
): Promise<ApiResponse<Album>> => {
  return apiRequest<Album>(`/projects/${projectId}/album/${albumId}/add`, {
    method: "POST",
    body: JSON.stringify({ url, provider }),
  })
}

export const deletePhotoFromAlbum = async (
  projectId: string,
  albumId: string,
  indexes: number[],
): Promise<ApiResponse<Album>> => {
  return apiRequest<Album>(`/projects/${projectId}/album/${albumId}/delete`, {
    method: "POST",
    body: JSON.stringify({ indexes }),
  })
}

export const albumsApi = {
  getByProject: async (projectId: string, params?: { page?: number; limit?: number }) => {
    const response = await getAlbums(projectId, params)
    return { success: response.code === 200, data: response.data.albums || response.data }
  },
  create: async (data: { projectId: string; name: string }) => {
    const response = await createAlbum(data.projectId, data.name)
    return { success: response.code === 200, data: response.data }
  },
  delete: async (albumId: string, projectId?: string) => {
    if (projectId) {
      const response = await deleteAlbum(projectId, albumId)
      return { success: response.code === 200 }
    }
    return { success: false }
  },
  getAlbum: async (projectId: string, albumId: string) => {
    const response = await getAlbum(projectId, albumId)
    return { success: response.code === 200, data: response.data }
  },
  bulkDelete: async (projectId: string, albumIds: string[]) => {
    const response = await bulkDeleteAlbums(projectId, albumIds)
    return { success: response.code === 200 }
  },
  addPhoto: async (projectId: string, albumId: string, url: string, provider: string) => {
    const response = await addPhotoToAlbum(projectId, albumId, url, provider)
    return { success: response.code === 200, data: response.data }
  },
  deletePhoto: async (projectId: string, albumId: string, indexes: number[]) => {
    const response = await deletePhotoFromAlbum(projectId, albumId, indexes)
    return { success: response.code === 200 }
  },
}
