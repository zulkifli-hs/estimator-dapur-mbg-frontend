import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dapurcek.id"
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME || ""
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || ""

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action") // "accept" or "reject"
  const projectId = searchParams.get("projectId")
  const boqId = searchParams.get("boqId")
  const email = searchParams.get("email")
  const code = searchParams.get("code")

  if (!action || !projectId || !boqId || !email || !code) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  if (!BASIC_AUTH_USERNAME || !BASIC_AUTH_PASSWORD) {
    return NextResponse.json({ error: "Approval service not configured" }, { status: 503 })
  }

  const basicToken = Buffer.from(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`).toString("base64")
  const backendUrl = `${API_BASE_URL}/projects/${projectId}/boq/${boqId}/${action}?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`

  const response = await fetch(backendUrl, {
    method: "GET",
    headers: {
      Authorization: `Basic ${basicToken}`,
    },
  })

  const json = await response.json().catch(() => ({
    code: response.status,
    message: { user: response.ok ? "Success" : "Request failed" },
  }))

  return NextResponse.json(json, { status: response.status })
}
