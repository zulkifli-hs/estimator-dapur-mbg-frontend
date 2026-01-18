import mongoose, { Schema, Document } from 'mongoose'

export type BugScale = 'critical' | 'high' | 'medium' | 'low'
export type BugStatus = 'open' | 'in_progress' | 'review' | 'resolved' | 'closed'

export interface IBugReport extends Document {
  title: string
  description: string
  userId: string
  userEmail?: string
  url?: string
  images?: string[]
  scale: BugScale
  status: BugStatus
  createdAt: Date
  updatedAt: Date
}

const BugReportSchema = new Schema<IBugReport>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
    },
    url: {
      type: String,
    },
    images: [{
      type: String,
    }],
    scale: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'review', 'resolved', 'closed'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
)

// Prevent model recompilation in development
export default mongoose.models.BugReport || mongoose.model<IBugReport>('BugReport', BugReportSchema)
