import type { Document, Model } from 'mongoose'

export type BugScale = 'critical' | 'high' | 'medium' | 'low'
export type BugStatus = 'backlog' | 'on-going' | 'review' | 'done'

export interface IBugReport extends Document {
  title: string
  description: string
  userId: string
  userEmail?: string
  url?: string
  images?: string[]
  status: BugStatus
  createdAt: Date
  updatedAt: Date
}

let BugReportModel: Model<IBugReport> | null = null

export async function getBugReportModel() {
  if (BugReportModel) return BugReportModel

  // ✅ Dynamic import
  const mongoose = (await import('mongoose')).default
  const { Schema } = mongoose

  const BugReportSchema = new Schema<IBugReport>(
    {
      title: { type: String, required: true, trim: true },
      description: { type: String, required: true },
      userId: { type: String, required: true },
      userEmail: String,
      url: String,
      images: [String],
      status: {
        type: String,
        enum: ['backlog', 'on-going', 'review', 'done'],
        default: 'backlog',
      },
    },
    { timestamps: true }
  )

  BugReportModel =
    mongoose.models.BugReport ||
    mongoose.model<IBugReport>('BugReport', BugReportSchema)

  return BugReportModel
}
