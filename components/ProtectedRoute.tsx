"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import Loading from "@/app/loading"

const publicPaths = ["/auth/login", "/auth/register", "/auth/forgot-password", "/setup"]

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      const isPublicPath = publicPaths.includes(pathname)

      if (!user && !isPublicPath) {
        router.push("/auth/login")
      } else if (user && isPublicPath && pathname !== "/setup") {
        // If logged in and trying to access auth pages, redirect to dashboard
        router.push("/")
      }
    }
  }, [user, loading, pathname, router])

  if (loading || (!user && !publicPaths.includes(pathname))) {
    return <Loading />
  }

  return <>{children}</>
}
