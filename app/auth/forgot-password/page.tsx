"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Target, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const { resetPassword } = useAuth()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await resetPassword(email)
      setIsEmailSent(true)
    } catch (error: any) {
      console.error("Password reset error:", error)
      alert(error.message || "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>We've sent a password reset link to {email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                If you don't see the email in your inbox, please check your spam folder.
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>
            </Button>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the email?{" "}
              <button onClick={() => setIsEmailSent(false)} className="text-blue-600 hover:underline font-medium">
                Try again
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <Link href="/auth/login" className="text-sm text-blue-600 hover:underline flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
