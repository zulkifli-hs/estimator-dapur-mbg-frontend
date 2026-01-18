import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, isProductionEnvironment } from '@/lib/mongodb'
import BugReport from '@/models/BugReport'

// GET - List all bug reports
export async function GET() {
  try {
    // In non-production, return mock data
    if (!isProductionEnvironment()) {
      console.log('[v0] Bug Reports: Returning mock data (non-production)')
      return NextResponse.json({
        success: true,
        data: [],
        preview: true,
      })
    }

    // Connect to database
    const { connected } = await connectToDatabase()
    if (!connected) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed', preview: false },
        { status: 503 }
      )
    }

    // Fetch bug reports, sorted by most recent first
    const reports = await BugReport.find().sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      data: reports,
      preview: false,
    })
  } catch (error) {
    console.error('[v0] Bug Reports: Error fetching reports:', error)
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
    const { title, description, userId, userEmail, url, images, scale } = body

    // Validate required fields
    if (!title || !description || !userId || !scale) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In non-production, log and return mock success
    if (!isProductionEnvironment()) {
      console.log('[v0] Bug Report (Preview Mode):', {
        title,
        description,
        userId,
        userEmail,
        url,
        images: images?.length || 0,
        scale,
        status: 'open',
      })

      return NextResponse.json({
        success: true,
        data: {
          _id: `mock_${Date.now()}`,
          title,
          description,
          userId,
          userEmail,
          url,
          images,
          scale,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        preview: true,
        message: 'Bug report logged (not persisted in preview mode)',
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

    // Create bug report in database
    const report = await BugReport.create({
      title,
      description,
      userId,
      userEmail,
      url,
      images,
      scale,
      status: 'open',
    })

    return NextResponse.json({
      success: true,
      data: report,
      preview: false,
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Bug Reports: Error creating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create bug report' },
      { status: 500 }
    )
  }
}
