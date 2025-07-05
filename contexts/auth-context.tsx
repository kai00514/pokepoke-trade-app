"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile, createUserProfile } from "@/lib/services/user-service_ver2"

interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  name?: string
  avatar_url?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    console.log("🔍 [AuthContext] fetchUserProfile START for:", userId)

    try {
      let profile = await getUserProfile(userId)

      if (!profile && userEmail) {
        console.log("🔧 [AuthContext] Creating new profile")
        profile = await createUserProfile(userId, userEmail)
      }

      console.log("🔍 [AuthContext] Setting profile:", profile)
      setUserProfile(profile)
    } catch (error) {
      console.error("❌ [AuthContext] fetchUserProfile error:", error)
      setUserProfile(null)
    }
  }

  const refreshSession = async () => {
    console.log("🔄 [AuthContext] refreshSession START")

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ [AuthContext] Session refresh error:", error)
        return
      }

      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email)
      } else {
        setUserProfile(null)
      }
    } catch (error) {
      console.error("❌ [AuthContext] refreshSession error:", error)
    }
  }

  const signOut = async () => {
    console.log("🚪 [AuthContext] Signing out")

    setSession(null)
    setUser(null)
    setUserProfile(null)

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("❌ [AuthContext] Sign out error:", error)
    }
  }

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      console.log("🚀 [AuthContext] getInitialSession START")

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        console.log("🔍 [AuthContext] Initial session:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          error: error?.message,
        })

        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email)
        }
      } catch (error) {
        console.error("❌ [AuthContext] Initial session error:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 認証状態変更リスナー
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 [AuthContext] Auth state changed:", event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      })

      setSession(session)
      setUser(session?.user || null)

      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserProfile(session.user.id, session.user.email)
      } else if (event === "SIGNED_OUT") {
        setUserProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
