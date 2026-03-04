import { API_BASE_URL, getAuthToken, apiRequest } from "./config"

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
  const response = await apiRequest<BOQ>(`/projects/${projectId}/boq/ai-based`, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  })
  return response.data
}

// Create BOQ from Excel
export const createBOQFromExcel = async (projectId: string, file: File): Promise<BOQ> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/boq/excel-based`, {
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
  const response = await apiRequest<BOQ>(`/projects/${projectId}/boq`, {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.data
}

export const createAdditionalBOQ = async (
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
    mechanicalElectrical: Array<{
      name: string
      products: Array<{ qty: number; name: string; unit: string; price: number }>
    }>
  },
): Promise<any> => {
  return apiRequest<any>(`/projects/${projectId}/boq/additional`, {
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
    mechanicalElectrical: Array<{
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
  const response = await apiRequest<BOQListResponse>(
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
  const response = await apiRequest<BOQ>(`/projects/${projectId}/boq/${boqId}`, {
    method: "GET",
  })
  return response.data
}

// Update BOQ with new API format
export const updateBOQ = async (
  projectId: string,
  boqId: string,
  data: {
    preliminary: Array<{ qty: number; name: string; unit: string; price: number; startDate?: string; endDate?: string }>
    fittingOut: Array<{
      name: string
      products: Array<{ qty: number; name: string; unit: string; price: number; startDate?: string; endDate?: string }>
    }>
    furnitureWork: Array<{
      name: string
      products: Array<{ qty: number; name: string; unit: string; price: number; startDate?: string; endDate?: string }>
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
  await apiRequest<void>(`/projects/${projectId}/boq/${boqId}`, {
    method: "DELETE",
  })
}

// Bulk delete additional BOQs
export const bulkDeleteBOQs = async (projectId: string, boqIds: string[]): Promise<void> => {
  await apiRequest<void>(`/projects/${projectId}/boq/delete`, {
    method: "POST",
    body: JSON.stringify({ boq_ids: boqIds }),
  })
}

// Generate Gantt chart
export const generateGanttChart = async (projectId: string, boqId: string): Promise<GanttChartData> => {
  const response = await apiRequest<GanttChartData>(`/projects/${projectId}/boq/${boqId}/gantt-chart`, {
    method: "POST",
  })
  return response.data
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
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Update discount and tax for a BOQ
export const updateDiscountTax = async (
  projectId: string,
  boqId: string,
  data: {
    discount: number
    discountType: "%" | "0"
    tax: number
    taxType: "%" | "0"
  },
): Promise<any> => {
  return apiRequest<any>(`/projects/${projectId}/boq/${boqId}/discount-tax`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Request BOQ approval
export const requestBOQApproval = async (projectId: string, boqId: string, data?: { email: string }): Promise<void> => {
  await apiRequest<void>(`/projects/${projectId}/boq/${boqId}/request`, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  })
}

// Client accept BOQ — proxied server-side so Basic auth stays out of the browser
export const acceptBOQ = async (projectId: string, boqId: string, email: string, code: string): Promise<void> => {
  const response = await fetch(
    `/api/boq-approval/action?action=accept&projectId=${projectId}&boqId=${boqId}&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
    { method: "GET" },
  )

  if (!response.ok) {
    const responseData = await response.json().catch(() => null)
    throw new Error(responseData?.message?.user || "Gagal approve BOQ")
  }
}

// Client reject BOQ — proxied server-side so Basic auth stays out of the browser
export const rejectBOQ = async (projectId: string, boqId: string, email: string, code: string): Promise<void> => {
  const response = await fetch(
    `/api/boq-approval/action?action=reject&projectId=${projectId}&boqId=${boqId}&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`,
    { method: "GET" },
  )

  if (!response.ok) {
    const responseData = await response.json().catch(() => null)
    throw new Error(responseData?.message?.user || "Gagal reject BOQ")
  }
}

// Verify BOQ approval token and get BOQ data
export const verifyBOQToken = async (token: string): Promise<any> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/token/boqs-approval?token=${token}`)
  if (!response.ok) {
    throw new Error("Failed to verify token")
  }
  return response.json()
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
  createAdditional: async (
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
      mechanicalElectrical: Array<{
        name: string
        products: Array<{ qty: number; name: string; unit: string; price: number }>
      }>
    },
  ) => {
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
      mechanicalElectrical: Array<{
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
      preliminary: Array<{
        qty: number
        name: string
        unit: string
        price: number
        startDate?: string
        endDate?: string
      }>
      fittingOut: Array<{
        name: string
        products: Array<{
          qty: number
          name: string
          unit: string
          price: number
          startDate?: string
          endDate?: string
        }>
      }>
      furnitureWork: Array<{
        name: string
        products: Array<{
          qty: number
          name: string
          unit: string
          price: number
          startDate?: string
          endDate?: string
        }>
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
  requestApproval: async (projectId: string, boqId: string, data?: { email: string }) => {
    await requestBOQApproval(projectId, boqId, data)
    return { success: true }
  },
  accept: async (projectId: string, boqId: string, email: string, code: string) => {
    await acceptBOQ(projectId, boqId, email, code)
    return { success: true }
  },
  reject: async (projectId: string, boqId: string, email: string, code: string) => {
    await rejectBOQ(projectId, boqId, email, code)
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
  verifyToken: async (token: string) => {
    try {
      const data = await verifyBOQToken(token)
      return { success: true, data }
    } catch (error) {
      console.error("Token verification error:", error)
      return { success: false, data: null }
    }
  },
  updateDiscountTax: async (
    projectId: string,
    boqId: string,
    data: { discount: number; discountType: "%" | "0"; tax: number; taxType: "%" | "0" },
  ) => {
    const result = await updateDiscountTax(projectId, boqId, data)
    return { success: true, data: result }
  },

  // Sub-item helpers — maps internal section names to URL slugs
  _getSectionSlug: (section: string): string => {
    switch (section) {
      case "fittingOut":
        return "fitting-out"
      case "furnitureWork":
        return "furniture-work"
      case "mechanicalElectrical":
        return "mechanical-electrical"
      default:
        return section
    }
  },

  addSubItem: async (
    projectId: string,
    boqId: string,
    section: string,
    categoryId: string | null,
    itemId: string,
    body: Record<string, unknown>,
  ) => {
    let endpoint: string
    if (section === "preliminary") {
      endpoint = `/projects/${projectId}/boq/${boqId}/preliminary/${itemId}/sub-items`
    } else {
      const slug = boqApi._getSectionSlug(section)
      endpoint = `/projects/${projectId}/boq/${boqId}/${slug}/${categoryId}/${itemId}/sub-items`
    }
    return apiRequest<any>(endpoint, { method: "POST", body: JSON.stringify(body) })
  },

  updateSubItem: async (
    projectId: string,
    boqId: string,
    section: string,
    categoryId: string | null,
    itemId: string,
    subItemId: string,
    body: Record<string, unknown>,
  ) => {
    let endpoint: string
    if (section === "preliminary") {
      endpoint = `/projects/${projectId}/boq/${boqId}/preliminary/${itemId}/sub-items/${subItemId}`
    } else {
      const slug = boqApi._getSectionSlug(section)
      endpoint = `/projects/${projectId}/boq/${boqId}/${slug}/${categoryId}/${itemId}/sub-items/${subItemId}`
    }
    return apiRequest<any>(endpoint, { method: "PUT", body: JSON.stringify(body) })
  },

  deleteSubItem: async (
    projectId: string,
    boqId: string,
    section: string,
    categoryId: string | null,
    itemId: string,
    subItemId: string,
  ) => {
    let endpoint: string
    if (section === "preliminary") {
      endpoint = `/projects/${projectId}/boq/${boqId}/preliminary/${itemId}/sub-items/${subItemId}`
    } else {
      const slug = boqApi._getSectionSlug(section)
      endpoint = `/projects/${projectId}/boq/${boqId}/${slug}/${categoryId}/${itemId}/sub-items/${subItemId}`
    }
    return apiRequest<any>(endpoint, { method: "DELETE" })
  },
}
