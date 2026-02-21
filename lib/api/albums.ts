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
  note?: string,
): Promise<ApiResponse<Album>> => {
  console.log("[v0] Adding photo to album API call:", { projectId, albumId, url, provider, note })

  return apiRequest<Album>(`/projects/${projectId}/album/${albumId}/add`, {
    method: "POST",
    body: JSON.stringify({ url, provider, note }),
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

export const renameAlbum = async (
  projectId: string,
  albumId: string,
  name: string,
): Promise<ApiResponse<Album>> => {
  return apiRequest<Album>(`/projects/${projectId}/album/${albumId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  })
}

export const editPhotoInAlbum = async (
  projectId: string,
  albumId: string,
  photoId: string,
  url: string,
  provider: string,
  note?: string,
): Promise<ApiResponse<Album>> => {
  return apiRequest<Album>(`/projects/${projectId}/album/${albumId}/${photoId}`, {
    method: "PUT",
    body: JSON.stringify({ url, provider, note }),
  })
}

export const albumsApi = {
  getByProject: async (projectId: string, params?: { page?: number; limit?: number }) => {
    const response = await getAlbums(projectId, params)
    return { success: response.code === 200, data: response.data.albums || response.data }
  },
  create: async (data: { projectId: string; name: string }) => {
    const response = await createAlbum(data.projectId, data.name)
    return { success: response.code === 200 || response.code === 201, data: response.data }
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
  addPhoto: async (projectId: string, albumId: string, url: string, provider: string, note?: string) => {
    const response = await addPhotoToAlbum(projectId, albumId, url, provider, note)
    console.log("[v0] addPhoto response:", response)
    return { success: response.code === 200 || response.code === 201, data: response.data }
  },
  deletePhoto: async (projectId: string, albumId: string, indexes: number[]) => {
    const response = await deletePhotoFromAlbum(projectId, albumId, indexes)
    return { success: response.code === 200 }
  },
  rename: async (projectId: string, albumId: string, name: string) => {
    const response = await renameAlbum(projectId, albumId, name)
    return { success: response.code === 200, data: response.data }
  },
  editPhoto: async (projectId: string, albumId: string, photoId: string, url: string, provider: string, note?: string) => {
    const response = await editPhotoInAlbum(projectId, albumId, photoId, url, provider, note)
    return { success: response.code === 200, data: response.data }
  },
}
