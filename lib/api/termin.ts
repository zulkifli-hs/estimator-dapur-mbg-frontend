import { apiRequest, getAuthToken, API_BASE_URL } from "./config"

export interface Termin {
  _id: string
  name: string
  status: "Draft" | "Pending" | "Sent" | "Approved" | "Rejected"
  value: number
  category: "DP" | "BAPP" | "BAST"
  valueType: "%" | "IDR"
  note?: string
  invoice?: { url: string; name: string; provider: string; version: number }
  slip?: { url: string; name: string; provider: string; version: number }
  bastDocument?: { url: string; name: string; provider: string; version: number }
  certificateData?: Record<string, any>
  createdBy: {
    _id: string
    email: string
    profile: {
      name: string
      photo?: {
        url: string
        provider: string
      }
      phone: string
    }
  }
  updatedBy: string
  photos: any[]
  taxes: any[]
  rejections: any[]
  createdAt: string
  updatedAt: string
}

// Create termin format
export const createTerminFormat = async (
  projectId: string,
  termins: Array<{ name: string; value: number; valueType: string }>,
): Promise<Termin[]> => {
  const response = await apiRequest<Termin[]>(`/projects/${projectId}/termin`, {
    method: "POST",
    body: JSON.stringify({ termins }),
  })
  return response.data
}

// Update termin format
export interface UpdateTerminEntry {
  _id?: string
  id?: string
  name: string
  percentage?: number
  value?: number
  valueType?: string
  note?: string
  isNew?: boolean
  isDeleteTermin?: boolean
  isDeleteAlbum?: boolean
}

export const updateTerminFormat = async (
  projectId: string,
  termins: UpdateTerminEntry[],
): Promise<Termin[]> => {
  const response = await apiRequest<Termin[]>(`/projects/${projectId}/termin`, {
    method: "PUT",
    body: JSON.stringify({ termins }),
  })
  return response.data
}

// Get all termins for a project
export const getTerminList = async (projectId: string): Promise<Termin[]> => {
  const response = await apiRequest<any>(`/projects/${projectId}/termin`, {
    method: "GET",
  })

  // Handle paginated response structure
  if (response.data && Array.isArray(response.data.list)) {
    return response.data.list
  }

  // Handle direct array response
  if (response.data && Array.isArray(response.data.termins)) {
    return response.data.termins
  }

  // Handle direct array in data
  if (Array.isArray(response.data)) {
    return response.data
  }

  console.error("[v0] Unexpected termin response structure:", response)
  return []
}

// Get specific termin
export const getTermin = async (projectId: string, terminId: string): Promise<Termin> => {
  const response = await apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}`, {
    method: "GET",
  })
  return response.data
}

// Add photo to termin
export const addTerminPhoto = async (projectId: string, terminId: string, file: File): Promise<Termin> => {
  const formData = new FormData()
  formData.append("photo", file)

  const token = getAuthToken()
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/termin/${terminId}/photos`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  )

  if (!response.ok) throw new Error("Upload failed")
  return response.json()
}

// Delete photo from termin
export const deleteTerminPhoto = async (projectId: string, terminId: string, photoUrl: string): Promise<Termin> => {
  const response = await apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/photos/delete`, {
    method: "PUT",
    body: JSON.stringify({ photo_url: photoUrl }),
  })
  return response.data
}

// Add tax file to termin
export const addTerminTaxFile = async (projectId: string, terminId: string, file: File): Promise<Termin> => {
  const formData = new FormData()
  formData.append("tax_file", file)

  const token = getAuthToken()
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/termin/${terminId}/taxes`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  )

  if (!response.ok) throw new Error("Upload failed")
  return response.json()
}

// Delete tax file from termin
export const deleteTerminTaxFile = async (projectId: string, terminId: string, fileUrl: string): Promise<Termin> => {
  const response = await apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/taxes/delete`, {
    method: "PUT",
    body: JSON.stringify({ file_url: fileUrl }),
  })
  return response.data
}

export const deleteTerminTaxByIndexes = async (
  projectId: string,
  terminId: string,
  indexes: number[],
): Promise<Termin> => {
  const response = await apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/taxes/delete`, {
    method: "POST",
    body: JSON.stringify({ indexes }),
  })
  return response.data
}

export const uploadTerminInvoicePdf = async (projectId: string, terminId: string, file: File): Promise<Termin> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/termin/${terminId}/invoice`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  )

  if (!response.ok) throw new Error("Upload invoice failed")
  return response.json()
}

export const uploadTerminTaxPdf = async (projectId: string, terminId: string, file: File): Promise<Termin> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/termin/${terminId}/taxes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  )

  if (!response.ok) throw new Error("Upload tax file failed")
  return response.json()
}

// Change termin status to pending
export const setTerminPending = async (projectId: string, terminId: string): Promise<Termin> => {
  const response = await apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/pending`, {
    method: "PATCH",
  })
  return response.data
}

// Change termin status to sent
export const setTerminSent = async (projectId: string, terminId: string): Promise<Termin> => {
  const response = await apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/sent`, {
    method: "PATCH",
  })
  return response.data
}

// Upload payment slip
export const uploadTerminSlip = async (projectId: string, terminId: string, file: File): Promise<Termin> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/termin/${terminId}/slip`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  )

  if (!response.ok) throw new Error("Upload failed")
  return response.json()
}

// Accept payment slip
export const acceptTerminSlip = async (projectId: string, terminId: string): Promise<Termin> => {
  const response = await apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/accept`, {
    method: "PUT",
  })
  return response.data
}

// Reject payment slip
export const rejectTerminSlip = async (projectId: string, terminId: string, reason: string): Promise<Termin> => {
  const response = await apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  })
  return response.data
}

// Save certificate data for BAPP/BAST termin
export const saveTerminCertificateData = async (
  projectId: string,
  terminId: string,
  certificateData: Record<string, any>,
): Promise<any> => {
  const response = await apiRequest<any>(`/projects/${projectId}/termin/${terminId}/certificate-data`, {
    method: "PATCH",
    body: JSON.stringify({ certificateData }),
  })
  return response.data
}

// Upload completed BAST/BAPP document
export const uploadTerminBastDocument = async (projectId: string, terminId: string, file: File): Promise<any> => {
  const formData = new FormData()
  formData.append("file", file)

  const token = getAuthToken()
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/termin/${terminId}/bast-document`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  )

  if (!response.ok) throw new Error("Upload BAST document failed")
  return response.json()
}

export const terminApi = {
  createTerminFormat,
  updateTerminFormat,
  getTerminList,
  getTermin,
  addTerminPhoto,
  deleteTerminPhoto,
  addTerminTaxFile,
  deleteTerminTaxFile,
  setTerminPending,
  setTerminSent,
  uploadTerminSlip,
  acceptTerminSlip,
  rejectTerminSlip,
  getByProject: async (projectId: string) => {
    try {
      const data = await getTerminList(projectId)
      return { success: true, data }
    } catch (error: any) {
      // If 404, return empty array (no termins exist yet)
      if (error?.status === 404 || error?.code === 404) {
        return { success: true, data: [] }
      }
      throw error
    }
  },
  getById: async (projectId: string, terminId: string) => {
    const data = await getTermin(projectId, terminId)
    return { success: true, data }
  },
  createFormat: async (projectId: string, termins: Array<{ name: string; percentage: number; note?: string }>) => {
    const transformedTermins = termins.map((t) => ({
      name: t.name,
      value: t.percentage,
      valueType: "%",
      ...(t.note && { note: t.note }),
    }))
    const data = await createTerminFormat(projectId, transformedTermins)
    return { success: true, data }
  },
  updateFormat: async (projectId: string, termins: UpdateTerminEntry[]) => {
    const data = await updateTerminFormat(projectId, termins)
    return { success: true, data }
  },
  addPhoto: async (projectId: string, terminId: string, file: File) => {
    const data = await addTerminPhoto(projectId, terminId, file)
    return { success: true, data }
  },
  deletePhoto: async (projectId: string, terminId: string, photoUrl: string) => {
    const data = await deleteTerminPhoto(projectId, terminId, photoUrl)
    return { success: true, data }
  },
  addTaxFile: async (projectId: string, terminId: string, file: File) => {
    const data = await addTerminTaxFile(projectId, terminId, file)
    return { success: true, data }
  },
  uploadInvoicePdf: async (projectId: string, terminId: string, file: File) => {
    const data = await uploadTerminInvoicePdf(projectId, terminId, file)
    return { success: true, data }
  },
  uploadTaxPdf: async (projectId: string, terminId: string, file: File) => {
    const data = await uploadTerminTaxPdf(projectId, terminId, file)
    return { success: true, data }
  },
  deleteTaxFile: async (projectId: string, terminId: string, fileUrl: string) => {
    const data = await deleteTerminTaxFile(projectId, terminId, fileUrl)
    return { success: true, data }
  },
  deleteTaxByIndexes: async (projectId: string, terminId: string, indexes: number[]) => {
    const data = await deleteTerminTaxByIndexes(projectId, terminId, indexes)
    return { success: true, data }
  },
  setPending: async (projectId: string, terminId: string) => {
    const data = await setTerminPending(projectId, terminId)
    return { success: true, data }
  },
  setSent: async (projectId: string, terminId: string) => {
    const data = await setTerminSent(projectId, terminId)
    return { success: true, data }
  },
  uploadSlip: async (projectId: string, terminId: string, file: File) => {
    const data = await uploadTerminSlip(projectId, terminId, file)
    return { success: true, data }
  },
  acceptSlip: async (projectId: string, terminId: string) => {
    const data = await acceptTerminSlip(projectId, terminId)
    return { success: true, data }
  },
  rejectSlip: async (projectId: string, terminId: string, reason: string) => {
    const data = await rejectTerminSlip(projectId, terminId, reason)
    return { success: true, data }
  },
  saveCertificateData: async (projectId: string, terminId: string, data: Record<string, any>) => {
    const result = await saveTerminCertificateData(projectId, terminId, data)
    return { success: true, data: result }
  },
  uploadBastDocument: async (projectId: string, terminId: string, file: File) => {
    const result = await uploadTerminBastDocument(projectId, terminId, file)
    return { success: true, data: result }
  },
}
