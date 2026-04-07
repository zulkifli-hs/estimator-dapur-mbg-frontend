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
import { forgotPassword } from "@/lib/api/auth"
import { DapurCekLogo } from "@/components/dapurcek-logo"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Decorative Background */}
      <div className="hidden lg:flex flex-col justify-between p-8 bg-linear-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
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
          <Link href="/">
            <DapurCekLogo className="h-8" />
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Reset your password</h2>
            <p className="text-lg text-muted-foreground">
              Forgot your password? Don't worry. We'll help you reset it and get back to monitoring your MBG kitchen
              construction projects.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Quick and secure</p>
                <p className="text-sm text-muted-foreground">Your account security is our priority</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Simple process</p>
                <p className="text-sm text-muted-foreground">Reset your password in just a few steps</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} DapurCek. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Forgot Password Form */}
      <div className="flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <DapurCekLogo className="h-10" />
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-4 pb-6">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
                <CardDescription className="text-base">
                  {success
                    ? "Check your email for further instructions"
                    : "Enter your email address and we'll send you a password reset link"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <Alert className="border-primary/50 bg-primary/10">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <AlertDescription className="text-base font-medium text-primary">
                      Password reset link sent!
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
                    </p>
                    <p>
                      Check your email and follow the link to reset your password. If you don't see the email, check
                      your spam folder.
                    </p>
                  </div>
                  <Button
                    className="w-full h-10"
                    onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
                  >
                    Continue to reset password
                  </Button>
                </div>
              ) : (
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

                  <Button type="submit" className="w-full h-10 mt-2" disabled={loading}>
                    {loading ? "Sending..." : "Send reset link"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
