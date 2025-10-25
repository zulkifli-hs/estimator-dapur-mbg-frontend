"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { getProfile } from "@/lib/api/auth"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("auth_token")

      if (!token) {
        router.push("/login")
        return
      }

      const response = await getProfile()
      if (response.data) {
        setUser(response.data)
        localStorage.setItem("user", JSON.stringify(response.data))
      } else {
        throw new Error("Failed to get profile")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={user} />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  )
}
