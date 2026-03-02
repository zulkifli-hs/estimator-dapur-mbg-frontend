"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("auth_token") // getAuthToken requires client env; use raw access here for auth guard

    if (token) {
      // User is already logged in, redirect to dashboard
      router.push("/dashboard")
    }
  }, [router])

  return <>{children}</>
}
