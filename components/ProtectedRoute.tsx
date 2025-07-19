"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import Loading from "@/app/loading"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

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

  const isPublicPath = publicPaths.includes(pathname)
  const isSharedPath = pathname.startsWith("/shared/")

  // For public paths and shared pages, don't show sidebar
  if (isPublicPath || isSharedPath) {
    return <>{children}</>
  }

  // For authenticated pages, show sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
