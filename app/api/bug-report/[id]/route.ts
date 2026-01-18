import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// PATCH - Update bug report status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['backlog', 'on-going', 'review', 'done']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const { isProductionEnvironment } = await import('@/lib/mongodb')

    if (!isProductionEnvironment()) {
      console.log(`[v0] Bug Report Update (Preview Mode): ${id} -> ${status}`)
      return NextResponse.json({
        success: true,
        data: { _id: id, status },
        preview: true,
      })
    }

    const { connectToDatabase } = await import('@/lib/mongodb')
    const { connected } = await connectToDatabase()

    if (!connected) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      )
    }

    const { getBugReportModel } = await import('@/models/BugReport')
    const BugReport = await getBugReportModel()

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
    })
  } catch (error) {
    console.error('[v0] Bug Reports PATCH error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update bug report' },
      { status: 500 }
    )
  }
}
