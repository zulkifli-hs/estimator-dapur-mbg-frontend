export interface BugReport {
  _id?: string
  title: string
  description: string
  url: string
  images: string[] // base64 images
  status: "backlog" | "on-going" | "review" | "done"
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export type BugReportStatus = BugReport["status"]
