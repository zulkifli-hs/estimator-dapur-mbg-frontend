export type BugStatus = "backlog" | "on-going" | "review" | "done"

export interface BugReport {
  _id?: string
  title: string
  description: string
  url?: string
  images: string[] // base64 encoded images
  status: BugStatus
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface CreateBugReportInput {
  title: string
  description: string
  url?: string
  images?: string[]
}

export interface UpdateBugReportInput {
  title?: string
  description?: string
  url?: string
  images?: string[]
  status?: BugStatus
}
