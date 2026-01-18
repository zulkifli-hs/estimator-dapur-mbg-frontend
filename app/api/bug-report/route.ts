import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// GET - List all bug reports
export async function GET() {
  try {
    const { isProductionEnvironment } = await import('@/lib/mongodb')

    if (!isProductionEnvironment()) {
      console.log('[v0] Bug Reports: Returning mock data (non-production)')
      return NextResponse.json({
        success: true,
        data: [],
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
    const reports = await BugReport.find().sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      data: reports,
    })
  } catch (error) {
    console.error('[v0] Bug Reports GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bug reports' },
      { status: 500 }
    )
  }
}

// POST - Create a new bug report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, userId, userEmail, url, images } = body

    if (!title || !description || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { isProductionEnvironment } = await import('@/lib/mongodb')

    if (!isProductionEnvironment()) {
      console.log('[v0] Bug Report (Preview Mode):', {
        title,
        description,
        userId,
        userEmail,
        url,
        images: images?.length || 0,
        status: 'backlog',
      })

      return NextResponse.json({
        success: true,
        preview: true,
        data: {
          _id: `mock_${Date.now()}`,
          title,
          description,
          userId,
          userEmail,
          url,
          images,
          status: 'backlog',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
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

    const report = await BugReport.create({
      title,
      description,
      userId,
      userEmail,
      url,
      images,
      status: 'backlog',
    })

    return NextResponse.json({
      success: true,
      data: report,
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Bug Reports POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create bug report' },
      { status: 500 }
    )
  }
}
