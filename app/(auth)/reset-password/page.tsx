"use client"

import type React from "react"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { resetPassword } from "@/lib/api/auth"
import { DapurCekLogo } from "@/components/dapurcek-logo"
import { ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const otpFromLink = !!searchParams.get("otp")
  const [otp, setOtp] = useState(searchParams.get("otp") ?? "")
  const [password, setPassword] = useState("")
  const [rePassword, setRePassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showRePassword, setShowRePassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== rePassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      await resetPassword(email, otp, password, rePassword)
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
            <h2 className="text-3xl font-bold">Create a new password</h2>
            <p className="text-lg text-muted-foreground">
              Enter the OTP code we sent to your email and choose a strong new password.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Check your email</p>
                <p className="text-sm text-muted-foreground">Use the OTP code we sent to your inbox</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Choose a strong password</p>
                <p className="text-sm text-muted-foreground">Your new password will be saved securely</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} DapurCek. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Reset Password Form */}
      <div className="flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <DapurCekLogo className="h-10" />
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-4 pb-6">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
                <CardDescription className="text-base">
                  {success
                    ? "Your password has been reset successfully"
                    : otpFromLink
                    ? "Enter your new password below"
                    : "Enter the OTP from your email and your new password"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <Alert className="border-primary/50 bg-primary/10">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <AlertDescription className="text-base font-medium text-primary">
                      Password reset successful!
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground">
                    You can now log in with your new password.
                  </p>
                  <Button className="w-full h-10" onClick={() => router.push("/login")}>
                    Go to Login
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

                  {!otpFromLink && (
                    <div className="space-y-2.5">
                      <Label htmlFor="otp" className="text-sm font-medium">
                        OTP Code
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter OTP from your email"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        disabled={loading}
                        className="h-10"
                        autoComplete="one-time-code"
                      />
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="text-sm font-medium">
                      New password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="rePassword" className="text-sm font-medium">
                      Confirm new password
                    </Label>
                    <div className="relative">
                      <Input
                        id="rePassword"
                        type={showRePassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={rePassword}
                        onChange={(e) => setRePassword(e.target.value)}
                        required
                        disabled={loading}
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRePassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showRePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-10 mt-2" disabled={loading}>
                    {loading ? "Resetting..." : "Reset password"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to forgot password
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
