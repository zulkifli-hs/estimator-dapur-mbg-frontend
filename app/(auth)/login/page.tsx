"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { login } from "@/lib/api/auth"
import { setAuthToken } from "@/lib/api/config"
import { GemaLogo } from "@/components/gema-logo"
import { ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await login({ usernameOrEmail: email, password })

      if (response.data?.accessToken) {
        setAuthToken(response.data.accessToken)
        localStorage.setItem("auth_token", response.data.accessToken)
        localStorage.setItem("user", JSON.stringify(response.data))
        router.push("/dashboard")
      } else {
        setError("Login successful but no access token received")
      }
    } catch (err) {
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase()
        if (errorMessage.includes("unauthorized")) {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else if (errorMessage.includes("network")) {
          setError("Network error. Please check your internet connection.")
        } else {
          setError(err.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Decorative Background */}
      <div className="hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <GemaLogo className="h-8" />
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Welcome back to Gema AI</h2>
            <p className="text-lg text-muted-foreground">
              Manage your interior design projects with precision. Access your dashboard to streamline estimates, track
              progress, and collaborate with your team.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Accurate Cost Estimation</p>
                <p className="text-sm text-muted-foreground">Create detailed BOQs with automatic calculations</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Visual Progress Tracking</p>
                <p className="text-sm text-muted-foreground">Monitor project timelines with Gantt charts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Gema AI. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <GemaLogo className="h-10" />
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-4 pb-6">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">Sign in to your account</CardTitle>
                <CardDescription className="text-base">Welcome back! Sign in with your credentials.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-10"
                  />
                </div>

                <Button type="submit" className="w-full h-10 mt-2 gap-2" disabled={loading}>
                  {loading ? "Signing in..." : <>Sign in</>}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4 border-t pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-semibold">
                  Create account
                </Link>
              </p>
            </CardFooter>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">New to Gema AI?</span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-10 bg-transparent" asChild>
            <Link href="/signup">
              Create free account
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
