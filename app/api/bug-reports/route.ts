import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import type { BugReport } from "@/lib/types/bug-report"

// GET all bug reports
export async function GET() {
  try {
    const db = await getDatabase()
    const collection = db.collection<BugReport>("bug_reports")
    const reports = await collection.find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      data: reports.map((report) => ({
        ...report,
        _id: report._id?.toString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching bug reports:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch bug reports" }, { status: 500 })
  }
}

// POST create new bug report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, url, images } = body

    if (!title || !description) {
      return NextResponse.json({ success: false, error: "Title and description are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const collection = db.collection<BugReport>("bug_reports")

    const newReport: Omit<BugReport, "_id"> = {
      title,
      description,
      url: url || "",
      images: images || [],
      status: "backlog",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await collection.insertOne(newReport as BugReport)

    return NextResponse.json({
      success: true,
      data: {
        ...newReport,
        _id: result.insertedId.toString(),
      },
    })
  } catch (error) {
    console.error("Error creating bug report:", error)
    return NextResponse.json({ success: false, error: "Failed to create bug report" }, { status: 500 })
  }
}
