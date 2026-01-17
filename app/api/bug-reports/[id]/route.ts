import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"
import type { BugReport } from "@/lib/types/bug-report"

// GET single bug report
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const collection = db.collection<BugReport>("bug_reports")

    const report = await collection.findOne({ _id: new ObjectId(id) })

    if (!report) {
      return NextResponse.json({ success: false, error: "Bug report not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        _id: report._id?.toString(),
      },
    })
  } catch (error) {
    console.error("Error fetching bug report:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch bug report" }, { status: 500 })
  }
}

// PUT update bug report
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, url, images, status } = body

    const db = await getDatabase()
    const collection = db.collection<BugReport>("bug_reports")

    const updateData: Partial<BugReport> = {
      updatedAt: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (url !== undefined) updateData.url = url
    if (images !== undefined) updateData.images = images
    if (status !== undefined) updateData.status = status

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ success: false, error: "Bug report not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        _id: result._id?.toString(),
      },
    })
  } catch (error) {
    console.error("Error updating bug report:", error)
    return NextResponse.json({ success: false, error: "Failed to update bug report" }, { status: 500 })
  }
}

// DELETE bug report
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const collection = db.collection<BugReport>("bug_reports")

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Bug report not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Bug report deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting bug report:", error)
    return NextResponse.json({ success: false, error: "Failed to delete bug report" }, { status: 500 })
  }
}
