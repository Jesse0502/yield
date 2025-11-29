"use client"

import { useEffect, useRef } from "react"
import { useAppDispatch } from "@/lib/store/hooks"
import { setSession, clearSession } from "@/lib/store/slices/authSlice"
import { fetchChatHistory } from "@/lib/store/slices/chatSlice"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"

const PUBLIC_PATHS = ["/", "/login"]

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const historyRequestedRef = useRef(false)

  const requestHistoryOnce = () => {
    if (historyRequestedRef.current) return
    dispatch(fetchChatHistory())
    historyRequestedRef.current = true
  }

  useEffect(() => {
    // 1. Check active session immediately on mount
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        dispatch(setSession({ user: session.user, token: session.access_token }))
        requestHistoryOnce()
      }
    }
    getSession()

    // 2. Listen for auth changes (Login, Logout, Token Refresh)
    // This handles persistence, tab syncing, and token refreshing automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        dispatch(setSession({ user: session.user, token: session.access_token }))
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          requestHistoryOnce()
        }
      } else {
        dispatch(clearSession())
        historyRequestedRef.current = false
        const isPublicRoute = PUBLIC_PATHS.some((route) => pathname === route || pathname.startsWith(`${route}/`))
        if (!isPublicRoute) {
          router.push("/login")
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch, router, pathname])

  return <>{children}</>
}

