import { apiRequest } from "./config"

export interface TemplateItem {
  qty: number
  name: string
  unit: string
  price: number
}

export interface TemplateCategory {
  name: string
  products: TemplateItem[]
}

export interface BOQTemplate {
  _id: string
  name: string
  preliminary: TemplateItem[]
  fittingOut: TemplateCategory[]
  furnitureWork: TemplateCategory[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateTemplateInput {
  name: string
  preliminary: TemplateItem[]
  fittingOut: TemplateCategory[]
  furnitureWork: TemplateCategory[]
}

export interface TemplateListResponse {
  code: number
  message: {
    dev: { name: string; problems: any[] }
    user: string
  }
  data: {
    page: number
    totalData: number
    totalPage: number
    list: BOQTemplate[]
  }
}

// Get all templates
export const getTemplates = async (): Promise<BOQTemplate[]> => {
  const response = await apiRequest<TemplateListResponse>("/template", {
    method: "GET",
  })
  return response.data?.list || []
}

// Get single template
export const getTemplate = async (id: string): Promise<BOQTemplate> => {
  const response = await apiRequest<{ code: number; message: any; data: BOQTemplate }>(`/template/${id}`, {
    method: "GET",
  })
  return response.data
}

// Create template
export const createTemplate = async (data: CreateTemplateInput): Promise<BOQTemplate> => {
  return apiRequest<BOQTemplate>("/template", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Update template
export const updateTemplate = async (id: string, data: CreateTemplateInput): Promise<BOQTemplate> => {
  return apiRequest<BOQTemplate>(`/template/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

// Delete template
export const deleteTemplate = async (id: string): Promise<void> => {
  return apiRequest<void>(`/template/${id}`, {
    method: "DELETE",
  })
}

// Bulk delete templates
export const bulkDeleteTemplates = async (ids: string[]): Promise<void> => {
  return apiRequest<void>("/template/delete", {
    method: "POST",
    body: JSON.stringify({ _ids: ids }),
  })
}

export const templatesApi = {
  getAll: async () => {
    try {
      const data = await getTemplates()
      return { success: true, data }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
      return { success: false, data: [] }
    }
  },
  getById: async (id: string) => {
    try {
      const data = await getTemplate(id)
      return { success: true, data }
    } catch (error) {
      console.error("Failed to fetch template:", error)
      return { success: false, data: null }
    }
  },
  create: async (templateData: CreateTemplateInput) => {
    const data = await createTemplate(templateData)
    return { success: true, data }
  },
  update: async (id: string, templateData: CreateTemplateInput) => {
    const data = await updateTemplate(id, templateData)
    return { success: true, data }
  },
  delete: async (id: string) => {
    await deleteTemplate(id)
    return { success: true }
  },
  bulkDelete: async (ids: string[]) => {
    await bulkDeleteTemplates(ids)
    return { success: true }
  },
}
