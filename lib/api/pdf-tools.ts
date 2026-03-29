import { API_BASE_URL, getAuthToken } from "./config"

const pdfFetch = async (endpoint: string, body: FormData): Promise<Blob> => {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}`)
  }

  return response.blob()
}

export const mergePdf = async (files: File[]): Promise<Blob> => {
  const formData = new FormData()
  files.forEach((file) => formData.append("files", file))
  return pdfFetch("/pdf-tools/merge", formData)
}

export const splitPdf = async (
  file: File,
  mode: "all" | "range",
  ranges?: string
): Promise<Blob> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("mode", mode)
  if (ranges) formData.append("ranges", ranges)
  return pdfFetch("/pdf-tools/split", formData)
}

export const compressPdf = async (file: File): Promise<Blob> => {
  const formData = new FormData()
  formData.append("file", file)
  return pdfFetch("/pdf-tools/compress", formData)
}

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
