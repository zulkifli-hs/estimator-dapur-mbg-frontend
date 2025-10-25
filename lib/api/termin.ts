import { apiRequest } from "./config"

export interface Termin {
  id: string
  name: string
  percentage: number
  amount: number
  status: "pending" | "sent" | "approved" | "rejected"
  photos: string[]
  tax_files: string[]
  slip_url?: string
  due_date: string
  created_at: string
  updated_at: string
}

// Create termin format
export const createTerminFormat = async (
  projectId: string,
  termins: Array<{ name: string; percentage: number }>,
): Promise<Termin[]> => {
  return apiRequest<Termin[]>(`/projects/${projectId}/termin`, {
    method: "POST",
    body: JSON.stringify({ termins }),
  })
}

// Update termin format
export const updateTerminFormat = async (
  projectId: string,
  termins: Array<{ id: string; name: string; percentage: number }>,
): Promise<Termin[]> => {
  return apiRequest<Termin[]>(`/projects/${projectId}/termin`, {
    method: "PUT",
    body: JSON.stringify({ termins }),
  })
}

// Get all termins for a project
export const getTerminList = async (projectId: string): Promise<Termin[]> => {
  return apiRequest<Termin[]>(`/projects/${projectId}/termin`, {
    method: "GET",
  })
}

// Get specific termin
export const getTermin = async (projectId: string, terminId: string): Promise<Termin> => {
  return apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}`, {
    method: "GET",
  })
}

// Add photo to termin
export const addTerminPhoto = async (projectId: string, terminId: string, file: File): Promise<Termin> => {
  const formData = new FormData()
  formData.append("photo", file)

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}/termin/${terminId}/photos`,
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
  return apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/photos/delete`, {
    method: "PUT",
    body: JSON.stringify({ photo_url: photoUrl }),
  })
}

// Add tax file to termin
export const addTerminTaxFile = async (projectId: string, terminId: string, file: File): Promise<Termin> => {
  const formData = new FormData()
  formData.append("tax_file", file)

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}/termin/${terminId}/taxes`,
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
  return apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/taxes/delete`, {
    method: "PUT",
    body: JSON.stringify({ file_url: fileUrl }),
  })
}

// Change termin status to pending
export const setTerminPending = async (projectId: string, terminId: string): Promise<Termin> => {
  return apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/pending`, {
    method: "PUT",
  })
}

// Change termin status to sent
export const setTerminSent = async (projectId: string, terminId: string): Promise<Termin> => {
  return apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/sent`, {
    method: "PUT",
  })
}

// Upload payment slip
export const uploadTerminSlip = async (projectId: string, terminId: string, file: File): Promise<Termin> => {
  const formData = new FormData()
  formData.append("slip", file)

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}/termin/${terminId}/slip`,
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

// Accept payment slip
export const acceptTerminSlip = async (projectId: string, terminId: string): Promise<Termin> => {
  return apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/accept`, {
    method: "PUT",
  })
}

// Reject payment slip
export const rejectTerminSlip = async (projectId: string, terminId: string, reason: string): Promise<Termin> => {
  return apiRequest<Termin>(`/projects/${projectId}/termin/${terminId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  })
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
    const data = await getTerminList(projectId)
    return { success: true, data }
  },
  getById: async (projectId: string, terminId: string) => {
    const data = await getTermin(projectId, terminId)
    return { success: true, data }
  },
  createFormat: async (projectId: string, termins: Array<{ name: string; percentage: number }>) => {
    const data = await createTerminFormat(projectId, termins)
    return { success: true, data }
  },
  updateFormat: async (projectId: string, termins: Array<{ id: string; name: string; percentage: number }>) => {
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
  deleteTaxFile: async (projectId: string, terminId: string, fileUrl: string) => {
    const data = await deleteTerminTaxFile(projectId, terminId, fileUrl)
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
}
