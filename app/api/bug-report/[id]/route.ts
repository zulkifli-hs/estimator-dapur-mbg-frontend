import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, isProductionEnvironment } from '@/lib/mongodb'
import BugReport from '@/models/BugReport'

// PATCH - Update bug report status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['open', 'in_progress', 'review', 'resolved', 'closed']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // In non-production, return mock success
    if (!isProductionEnvironment()) {
      console.log(`[v0] Bug Report Update (Preview Mode): ${id} -> ${status}`)
      return NextResponse.json({
        success: true,
        data: { _id: id, status },
        preview: true,
        message: 'Status updated (not persisted in preview mode)',
      })
    }

    // Connect to database
    const { connected } = await connectToDatabase()
    if (!connected) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      )
    }

    // Update bug report status
    const report = await BugReport.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Bug report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: report,
      preview: false,
    })
  } catch (error) {
    console.error('[v0] Bug Reports: Error updating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update bug report' },
      { status: 500 }
    )
  }
}
