import { apiRequest } from "./config"

export interface Notification {
  _id: string
  type: string
  title: string
  message: string
  isRead: boolean
  data?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface NotificationsResponse {
  page: number
  totalData: number
  totalPage: number
  list: Notification[]
  unreadCount: number
}

export const notificationsApi = {
  getAll: async (page = 1, limit = 20): Promise<NotificationsResponse> => {
    const response = await apiRequest<NotificationsResponse>(
      `/notifications?page=${page}&limit=${limit}`,
      { method: "GET" }
    )
    return response.data
  },

  markAllRead: async (): Promise<void> => {
    await apiRequest<void>("/notifications/read/all", { method: "POST" })
  },

  markRead: async (id: string): Promise<void> => {
    await apiRequest<void>(`/notifications/read/${id}`, { method: "POST" })
  },
}
