import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/db/mongodb"
import type { BugReport, UpdateBugReportInput } from "@/lib/types/bug-report"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const collection = db.collection<BugReport>("bug-reports")

    const bugReport = await collection.findOne({ _id: new ObjectId(id) })

    if (!bugReport) {
      return NextResponse.json({ success: false, error: "Bug report not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: bugReport })
  } catch (error) {
    console.error("Error fetching bug report:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch bug report" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body: UpdateBugReportInput = await request.json()

    const db = await getDatabase()
    const collection = db.collection<BugReport>("bug-reports")

    const updateData: Partial<BugReport> = {
      updatedAt: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.url !== undefined) updateData.url = body.url
    if (body.images !== undefined) updateData.images = body.images
    if (body.status !== undefined) updateData.status = body.status

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ success: false, error: "Bug report not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error updating bug report:", error)
    return NextResponse.json({ success: false, error: "Failed to update bug report" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const collection = db.collection<BugReport>("bug-reports")

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Bug report not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bug report:", error)
    return NextResponse.json({ success: false, error: "Failed to delete bug report" }, { status: 500 })
  }
}
