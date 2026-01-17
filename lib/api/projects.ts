import { apiRequest, API_BASE_URL, getAuthToken, type ApiResponse } from "./config"

export interface Project {
  _id: string
  name: string
  type: string
  area: number
  building: string
  floor: number
  owner: {
    _id: string
    email: string
    profile?: {
      name: string
      photo?: {
        url: string
        provider: string
      }
      phone?: string
    }
    createdAt: string
    updatedAt: string
  }
  companyClient: {
    name: string
    contact?: {
      phone?: string
      email?: string
      website?: string
    }
    type: string
    _id: string
    createdAt: string
    updatedAt: string
  }
  companyOwner: {
    _id: string
    name: string
    code: string
    createdAt: string
    updatedAt: string
  }
  estimators: Array<{
    status: string
    user: {
      _id: string
      email: string
      profile?: {
        name: string
        photo?: { url: string; provider: string }
        phone?: string
      }
    }
    invitedBy: string
    code: string
    _id: string
    createdAt: string
    updatedAt: string
  }>
  projectManagers: Array<{
    status: string
    user: {
      _id: string
      email: string
      profile?: {
        name: string
        photo?: { url: string; provider: string }
        phone?: string
      }
    }
    invitedBy: string
    code: string
    _id: string
    createdAt: string
    updatedAt: string
  }>
  finances: Array<{
    status: string
    user: {
      _id: string
      email: string
      profile?: {
        name: string
        photo?: { url: string; provider: string }
        phone?: string
      }
    }
    invitedBy: string
    code: string
    _id: string
    createdAt: string
    updatedAt: string
  }>
  designers: Array<{
    status: string
    user: {
      _id: string
      email: string
      profile?: {
        name: string
        photo?: { url: string; provider: string }
        phone?: string
      }
    }
    invitedBy: string
    code: string
    _id: string
    createdAt: string
    updatedAt: string
  }>
  clients: Array<{
    status: string
    user: {
      _id: string
      email: string
      profile?: {
        name: string
        photo?: { url: string; provider: string }
        phone?: string
      }
    }
    invitedBy: string
    code: string
    _id: string
    createdAt: string
    updatedAt: string
  }>
  admins: Array<{
    status: string
    user: {
      _id: string
      email: string
      profile?: {
        name: string
        photo?: { url: string; provider: string }
        phone?: string
      }
    }
    invitedBy: string
    code: string
    _id: string
    createdAt: string
    updatedAt: string
  }>
  detail?: {
    layout?: {
      name: string
      url: string
      provider: string
      version: number
      createdBy: string
      _id: string
      createdAt: string
      updatedAt: string
    }
    contract?: {
      name: string
      url: string
      provider: string
      version: number
      createdBy: string
      _id: string
      createdAt: string
      updatedAt: string
    }
    shopDrawingFitout?: any[]
    shopDrawingFurniture?: any[]
    approvedMaterial?: any[]
    approvedFurniture?: any[]
    createdAt?: string
    updatedAt?: string
  }
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectData {
  name: string
  type: string
  area: number
  building: string
  floor: number
  companyClient?: {
    name: string
    contact?: {
      phone?: string
      email?: string
      website?: string
    }
    type: string
    picEmail?: string
    picName?: string
    picPhone?: string
  }
  companyOwner: {
    name: string
    code: string
  }
  estimators?: string[]
  projectManagers?: string[]
  finances?: string[]
  designers?: string[]
  admins?: string[]
}

const getProjects = async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<
  ApiResponse<{ list: Project[]; totalData: number; totalPage: number; page: number }>
> => {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())
  if (params?.search) queryParams.append("search", params.search)
  if (params?.status) queryParams.append("status", params.status)

  const queryString = queryParams.toString()
  return apiRequest<{ list: Project[]; totalData: number; totalPage: number; page: number }>(
    `/projects${queryString ? `?${queryString}` : ""}`,
    { method: "GET" },
  )
}

const getProject = async (id: string): Promise<ApiResponse<Project>> => {
  return apiRequest<Project>(`/projects/${id}`, { method: "GET" })
}

const createProject = async (data: CreateProjectData): Promise<ApiResponse<Project>> => {
  return apiRequest<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

const updateProject = async (id: string, data: Partial<CreateProjectData>): Promise<ApiResponse<Project>> => {
  return apiRequest<Project>(`/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

const deleteProject = async (id: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/projects/${id}`, { method: "DELETE" })
}

const bulkDeleteProjects = async (ids: string[]): Promise<ApiResponse<any>> => {
  return apiRequest<any>("/projects/delete", {
    method: "POST",
    body: JSON.stringify({ _ids: ids }),
  })
}

const inviteMember = async (projectId: string, data: string[], role: string): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/projects/${projectId}/invite`, {
    method: "POST",
    body: JSON.stringify({ data, role }),
  })
}

const removeMember = async (projectId: string, data: string[], role: string): Promise<ApiResponse<any>> => {
  console.log("[v0] API removeMember request:", { projectId, data, role })

  return apiRequest<any>(`/projects/${projectId}/remove`, {
    method: "POST",
    body: JSON.stringify({ data, role }),
  })
}

const acceptInvitation = async (
  projectId: string,
  email: string,
  role: string,
  code: string,
): Promise<ApiResponse<any>> => {
  return apiRequest<any>(`/projects/${projectId}/accept?email=${email}&role=${role}&code=${code}`, {
    method: "GET",
  })
}

const uploadLayout = async (projectId: string, file: File): Promise<ApiResponse<any>> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/layout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  return response.json()
}

const uploadContract = async (projectId: string, file: File): Promise<ApiResponse<any>> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/contract`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  return response.json()
}

const updateProjectStatus = async (
  id: string,
  status: "active" | "completed" | "archive",
): Promise<ApiResponse<Project>> => {
  return apiRequest<Project>(`/projects/${id}/${status}`, {
    method: "PATCH",
  })
}

export const projectsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const response = await getProjects(params)
    return {
      success: response.code === 200,
      data: response.data.list,
      totalData: response.data.totalData,
      totalPage: response.data.totalPage,
      page: response.data.page,
    }
  },
  getById: async (id: string) => {
    const response = await getProject(id)
    return { success: response.code === 200, data: response.data }
  },
  create: async (projectData: CreateProjectData) => {
    const response = await createProject(projectData)
    return {
      success: response.code === 200 || response.code === 201,
      data: response.data,
      message: response.message,
    }
  },
  update: async (id: string, projectData: Partial<CreateProjectData>) => {
    const response = await updateProject(id, projectData)
    return { success: response.code === 200, data: response.data }
  },
  delete: async (id: string) => {
    const response = await deleteProject(id)
    return { success: response.code === 200 }
  },
  bulkDelete: async (ids: string[]) => {
    const response = await bulkDeleteProjects(ids)
    return { success: response.code === 200 }
  },
  inviteMember: async (projectId: string, emails: string[], role: string) => {
    const response = await inviteMember(projectId, emails, role)
    return { success: response.code === 200 }
  },
  removeMember: async (projectId: string, memberIds: string[], role: string) => {
    const response = await removeMember(projectId, memberIds, role)
    return { success: response.code === 200 }
  },
  acceptInvitation: async (projectId: string, email: string, role: string, code: string) => {
    const response = await acceptInvitation(projectId, email, role, code)
    return { success: response.code === 200 }
  },
  uploadLayout: async (projectId: string, file: File) => {
    const response = await uploadLayout(projectId, file)
    return { success: response.code === 200, data: response.data }
  },
  uploadContract: async (projectId: string, file: File) => {
    const response = await uploadContract(projectId, file)
    return { success: response.code === 200, data: response.data }
  },
  updateStatus: async (id: string, status: "active" | "completed" | "archive") => {
    const response = await updateProjectStatus(id, status)
    return { success: response.code === 200, data: response.data }
  },
}
