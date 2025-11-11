import { apiRequest } from "./config"

export interface BOQItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  category: string
}

export interface BOQ {
  id: string
  name: string
  type: "main" | "additional"
  status: "draft" | "pending" | "approved" | "rejected"
  items: BOQItem[]
  total_value: number
  created_at: string
  updated_at: string
}

export interface GanttChartData {
  tasks: Array<{
    id: string
    name: string
    start: string
    end: string
    progress: number
    dependencies?: string[]
  }>
}

export interface BOQListResponse {
  page: number
  totalData: number
  totalPage: number
  list: BOQ[]
}

// Create BOQ from AI
export const createBOQFromAI = async (projectId: string, prompt: string): Promise<BOQ> => {
  return apiRequest<BOQ>(`/projects/${projectId}/boq/ai-based`, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  })
}

// Create BOQ from Excel
export const createBOQFromExcel = async (projectId: string, file: File): Promise<BOQ> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}/boq/excel-based`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) throw new Error("Upload failed")
  return response.json()
}

// Create main BOQ
export const createMainBOQ = async (
  projectId: string,
  data: { name: string; items: Omit<BOQItem, "id">[] },
): Promise<BOQ> => {
  return apiRequest<BOQ>(`/projects/${projectId}/boq`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Create additional BOQ
export const createAdditionalBOQ = async (
  projectId: string,
  data: { name: string; items: Omit<BOQItem, "id">[] },
): Promise<BOQ> => {
  return apiRequest<BOQ>(`/projects/${projectId}/boq/additional`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Create BOQ with new API format
export const createBOQ = async (
  projectId: string,
  data: {
    preliminary: Array<{ qty: number; name: string; unit: string; price: number }>
    fittingOut: Array<{
      name: string
      products: Array<{ qty: number; name: string; unit: string; price: number }>
    }>
    furnitureWork: Array<{
      name: string
      products: Array<{ qty: number; name: string; unit: string; price: number }>
    }>
  },
): Promise<any> => {
  return apiRequest<any>(`/projects/${projectId}/boq`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Get all BOQs for a project
export const getBOQList = async (projectId: string): Promise<BOQ[]> => {
  const response = await apiRequest<{ code: number; message: any; data: BOQListResponse }>(
    `/projects/${projectId}/boq`,
    {
      method: "GET",
    },
  )
  // Return the list array from the paginated data
  return response.data?.list || []
}

// Get specific BOQ
export const getBOQ = async (projectId: string, boqId: string): Promise<BOQ> => {
  return apiRequest<BOQ>(`/projects/${projectId}/boq/${boqId}`, {
    method: "GET",
  })
}

// Update BOQ with new API format
export const updateBOQ = async (
  projectId: string,
  boqId: string,
  data: {
    preliminary: Array<{ qty: number; name: string; unit: string; price: number }>
    fittingOut: Array<{
      name: string
      products: Array<{ qty: number; name: string; unit: string; price: number }>
    }>
    furnitureWork: Array<{
      name: string
      products: Array<{ qty: number; name: string; unit: string; price: number }>
    }>
  },
): Promise<any> => {
  return apiRequest<any>(`/projects/${projectId}/boq/${boqId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

// Delete additional BOQ
export const deleteAdditionalBOQ = async (projectId: string, boqId: string): Promise<void> => {
  return apiRequest<void>(`/projects/${projectId}/boq/${boqId}`, {
    method: "DELETE",
  })
}

// Bulk delete additional BOQs
export const bulkDeleteBOQs = async (projectId: string, boqIds: string[]): Promise<void> => {
  return apiRequest<void>(`/projects/${projectId}/boq/delete`, {
    method: "POST",
    body: JSON.stringify({ boq_ids: boqIds }),
  })
}

// Generate Gantt chart
export const generateGanttChart = async (projectId: string, boqId: string): Promise<GanttChartData> => {
  return apiRequest<GanttChartData>(`/projects/${projectId}/boq/${boqId}/gantt-chart`, {
    method: "POST",
  })
}

// Update Gantt chart dates
export const updateGanttChart = async (
  projectId: string,
  boqId: string,
  data: {
    preliminary: Array<{ startDate: string; endDate: string }>
    fittingOut: Array<{
      name: string
      products: Array<{ startDate: string; endDate: string }>
    }>
    furnitureWork: Array<{
      name: string
      products: Array<{ startDate: string; endDate: string }>
    }>
  },
): Promise<any> => {
  return apiRequest<any>(`/projects/${projectId}/boq/${boqId}/gantt-chart`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

// Request BOQ approval
export const requestBOQApproval = async (projectId: string, boqId: string): Promise<void> => {
  return apiRequest<void>(`/projects/${projectId}/boq/${boqId}/request`, {
    method: "POST",
  })
}

// Client accept BOQ
export const acceptBOQ = async (projectId: string, boqId: string, token: string): Promise<void> => {
  return apiRequest<void>(`/projects/${projectId}/boq/${boqId}/accept?token=${token}`, {
    method: "GET",
  })
}

// Client reject BOQ
export const rejectBOQ = async (projectId: string, boqId: string, token: string, reason: string): Promise<void> => {
  return apiRequest<void>(`/projects/${projectId}/boq/${boqId}/reject?token=${token}`, {
    method: "GET",
  })
}

export const boqApi = {
  getByProject: async (projectId: string) => {
    try {
      const data = await getBOQList(projectId)
      return { success: true, data }
    } catch (error) {
      console.error("[v0] BOQ API error:", error)
      return { success: false, data: [] }
    }
  },
  getById: async (projectId: string, boqId: string) => {
    const data = await getBOQ(projectId, boqId)
    return { success: true, data }
  },
  createFromAI: async (projectId: string, prompt: string) => {
    const data = await createBOQFromAI(projectId, prompt)
    return { success: true, data }
  },
  createFromExcel: async (projectId: string, file: File) => {
    const data = await createBOQFromExcel(projectId, file)
    return { success: true, data }
  },
  createMain: async (projectId: string, boqData: { name: string; items: Omit<BOQItem, "id">[] }) => {
    const data = await createMainBOQ(projectId, boqData)
    return { success: true, data }
  },
  createAdditional: async (projectId: string, boqData: { name: string; items: Omit<BOQItem, "id">[] }) => {
    const data = await createAdditionalBOQ(projectId, boqData)
    return { success: true, data }
  },
  create: async (
    projectId: string,
    boqData: {
      preliminary: Array<{ qty: number; name: string; unit: string; price: number }>
      fittingOut: Array<{
        name: string
        products: Array<{ qty: number; name: string; unit: string; price: number }>
      }>
      furnitureWork: Array<{
        name: string
        products: Array<{ qty: number; name: string; unit: string; price: number }>
      }>
    },
  ) => {
    const data = await createBOQ(projectId, boqData)
    return { success: true, data }
  },
  update: async (
    projectId: string,
    boqId: string,
    boqData: {
      preliminary: Array<{ qty: number; name: string; unit: string; price: number }>
      fittingOut: Array<{
        name: string
        products: Array<{ qty: number; name: string; unit: string; price: number }>
      }>
      furnitureWork: Array<{
        name: string
        products: Array<{ qty: number; name: string; unit: string; price: number }>
      }>
    },
  ) => {
    const data = await updateBOQ(projectId, boqId, boqData)
    return { success: true, data }
  },
  delete: async (projectId: string, boqId: string) => {
    await deleteAdditionalBOQ(projectId, boqId)
    return { success: true }
  },
  bulkDelete: async (projectId: string, boqIds: string[]) => {
    await bulkDeleteBOQs(projectId, boqIds)
    return { success: true }
  },
  generateGantt: async (projectId: string, boqId: string) => {
    const data = await generateGanttChart(projectId, boqId)
    return { success: true, data }
  },
  requestApproval: async (projectId: string, boqId: string) => {
    await requestBOQApproval(projectId, boqId)
    return { success: true }
  },
  accept: async (projectId: string, boqId: string, token: string) => {
    await acceptBOQ(projectId, boqId, token)
    return { success: true }
  },
  reject: async (projectId: string, boqId: string, token: string, reason: string) => {
    await rejectBOQ(projectId, boqId, token, reason)
    return { success: true }
  },
  updateGanttChart: async (
    projectId: string,
    boqId: string,
    data: {
      preliminary: Array<{ startDate: string; endDate: string }>
      fittingOut: Array<{
        name: string
        products: Array<{ startDate: string; endDate: string }>
      }>
      furnitureWork: Array<{
        name: string
        products: Array<{ startDate: string; endDate: string }>
      }>
    },
  ) => {
    const result = await updateGanttChart(projectId, boqId, data)
    return { success: true, data: result }
  },
}
