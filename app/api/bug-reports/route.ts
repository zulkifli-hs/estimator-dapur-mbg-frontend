import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, isMongoDBAvailable } from "@/lib/db/mongodb"
import type { BugReport, CreateBugReportInput } from "@/lib/types/bug-report"

export async function GET() {
  try {
    if (!isMongoDBAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: "Bug tracker is not available in preview mode",
          previewMode: true,
        },
        { status: 503 },
      )
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
        },
        { status: 500 },
      )
    }

    const collection = db.collection<BugReport>("bug-reports")
    const bugReports = await collection.find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ success: true, data: bugReports })
  } catch (error) {
    console.error("Error fetching bug reports:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch bug reports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isMongoDBAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: "Bug tracker is not available in preview mode",
          previewMode: true,
        },
        { status: 503 },
      )
    }

    const body: CreateBugReportInput = await request.json()

    if (!body.title || !body.description) {
      return NextResponse.json({ success: false, error: "Title and description are required" }, { status: 400 })
    }

    const db = await getDatabase()
    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
        },
        { status: 500 },
      )
    }

    const collection = db.collection<BugReport>("bug-reports")

    const newBugReport: Omit<BugReport, "_id"> = {
      title: body.title,
      description: body.description,
      url: body.url || "",
      images: body.images || [],
      status: "backlog",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await collection.insertOne(newBugReport as BugReport)

    return NextResponse.json({
      success: true,
      data: { ...newBugReport, _id: result.insertedId.toString() },
    })
  } catch (error) {
    console.error("Error creating bug report:", error)
    return NextResponse.json({ success: false, error: "Failed to create bug report" }, { status: 500 })
  }
}
