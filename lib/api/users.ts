import { apiRequest } from "./config"

export interface User {
  _id: string
  email: string
  profile: {
    name: string
    photo: {
      url: string
      provider: string
    }
    phone?: string
  }
  createdAt: string
  updatedAt: string
}

export const usersApi = {
  search: async (keyword: string): Promise<User[]> => {
    try {
      const response = await apiRequest(`/users?search=${encodeURIComponent(keyword)}`, {
        method: "GET",
      })

      if (response.code === 200 && response.data?.list) {
        return response.data.list
      }

      return []
    } catch (error) {
      console.error("[v0] Failed to search users:", error)
      return []
    }
  },
}
