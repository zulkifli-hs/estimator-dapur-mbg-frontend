import { apiRequest } from "./config"

export interface TrendStat {
  total: number
  before: number // count in previous month
  today: number // count in current month
}

export interface ProjectProgressItem {
  month: number // 1-12
  completed: number
  ongoing: number
}

export interface BoqStats {
  total: number
  draft: number
  request: number
  accepted: number
  rejected: number
}

export interface MediaStats {
  photos: number
  files: number
  storage: {
    usage: number // GB
    total: number // GB
  }
}

export interface TeamStats {
  estimators: number
  projectManagers: number
  designers: number
  finances: number
}

export interface CpuStats {
  model: string
  cores: number
  usage: number // percentage 0-100
}

export interface MemoryStats {
  total: number // GB
  used: number // GB
  free: number // GB
}

export interface DiskPartition {
  mount: string
  size: number // GB
  used: number // GB
}

export interface ServerStats {
  cpu: CpuStats
  memory: MemoryStats
  disk: DiskPartition[]
}

export interface DashboardData {
  totalProject: TrendStat
  activeProject: TrendStat
  completedProject: TrendStat
  totalClient: TrendStat
  projectProgress: ProjectProgressItem[]
  boq: BoqStats
  media: MediaStats
  team: TeamStats
  // Admin-only fields
  totalUsers?: number
  totalProducts?: number
  totalTemplates?: number
  serverStats?: ServerStats
}

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiRequest<DashboardData>("/dashboard", { method: "GET" })
    return response.data
  },
}
