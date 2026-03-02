import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.gema-interior.com"
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME || ""
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || ""

export async function POST(request: NextRequest) {
  if (!BASIC_AUTH_USERNAME || !BASIC_AUTH_PASSWORD) {
    return NextResponse.json({ error: "Upload service not configured" }, { status: 503 })
  }

  const formData = await request.formData()
  const basicToken = Buffer.from(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`).toString("base64")

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
    },
    body: formData,
  })

  const json = await response.json().catch(() => ({ code: response.status, message: "Upload failed" }))

  return NextResponse.json(json, { status: response.status })
}
