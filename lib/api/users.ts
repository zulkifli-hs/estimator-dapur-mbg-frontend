import { apiRequest } from "./config"

export interface Permission {
  path: string
  method: string
}

export interface User {
  _id: string
  email: string
  status: "Active" | "Inactive"
  admin?: boolean
  type?: "Internal" | "External"
  profile?: {
    name?: string
    photo?: {
      url: string
      provider: string
    }
    phone?: string
  }
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
  projects?: Array<{
    _id: string
    project: {
      _id: string
      name: string
    }
    roles: string[]
  }>
}

export interface UpdatePermissionsInput {
  users: {
    _id: string
    permissions: Permission[]
  }[]
}

export interface CreateUserInput {
  email: string
  password: string
  profile?: {
    name?: string
    photo?: {
      url: string
      provider: string
    }
    phone?: string
  }
  type?: "Internal" | "External"
}

export interface UpdateUserInput {
  email?: string
  password?: string
  profile?: {
    name?: string
    photo?: {
      url: string
      provider: string
    }
    phone?: string
  }
  type?: "Internal" | "External"
}

export const usersApi = {
  getAll: async (
    page = 1,
    limit = 10,
    search?: string,
    type?: "Internal" | "External",
  ): Promise<{ list: User[]; totalData: number; totalPage: number; page: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (search) {
      params.append("search", search)
    }

    if (type) {
      params.append("type", type)
    }

    const response = await apiRequest<{ list: User[]; totalData: number; totalPage: number; page: number }>(`/users?${params.toString()}`, {
      method: "GET",
    })

    return response.data
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiRequest<User>(`/users/${id}`, {
      method: "GET",
    })

    return response.data
  },

  create: async (data: CreateUserInput): Promise<User> => {
    const response = await apiRequest<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    })

    return response.data
  },

  update: async (id: string, data: UpdateUserInput): Promise<User> => {
    const response = await apiRequest<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })

    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest(`/users/${id}`, {
      method: "DELETE",
    })
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiRequest("/users/delete", {
      method: "POST",
      body: JSON.stringify({ _ids: ids }),
    })
  },

  search: async (keyword: string): Promise<User[]> => {
    try {
      const response = await apiRequest<{ list: User[]; totalData: number; totalPage: number; page: number }>(`/users?search=${encodeURIComponent(keyword)}`, {
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

  activate: async (id: string): Promise<User> => {
    const response = await apiRequest<User>(`/users/${id}/active`, {
      method: "PUT",
    })

    return response.data
  },

  deactivate: async (id: string): Promise<User> => {
    const response = await apiRequest<User>(`/users/${id}/inactive`, {
      method: "PUT",
    })

    return response.data
  },

  updatePermissions: async (data: UpdatePermissionsInput): Promise<void> => {
    await apiRequest("/users/permissions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}

// ── User Preferences (theme + dashboard layout, synced to server) ─────────────

export interface UserPreferences {
  theme?: "light" | "dark" | "system"
  dashboardLayout?: {
    admin?: { cardOrder: string[]; hiddenCards: string[] }
    user?: { cardOrder: string[]; hiddenCards: string[] }
  }
}

export const preferencesApi = {
  /** Fetch the current user's preferences from the server. Returns null if unauthenticated or on error. */
  get: async (): Promise<UserPreferences | null> => {
    try {
      const response = await apiRequest<{ preferences?: UserPreferences }>("/auths/profiles", { method: "GET" })
      return response.data?.preferences ?? null
    } catch {
      return null
    }
  },

  /** Partially update preferences on the server (fire-and-forget safe). */
  update: async (prefs: Partial<UserPreferences>): Promise<void> => {
    try {
      await apiRequest("/auths/profiles/preferences", {
        method: "PATCH",
        body: JSON.stringify(prefs),
      })
    } catch {
      // Fail silently — localStorage is always the fast fallback
    }
  },
}
