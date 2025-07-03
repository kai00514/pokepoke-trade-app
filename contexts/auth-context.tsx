"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile } from "@/lib/services/user-service_ver2"

interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
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

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("🔍 [fetchUserProfile] START - Fetching user profile for:", userId)
      const profile = await getUserProfile(userId)
      console.log("🔍 [fetchUserProfile] getUserProfile returned:", profile)
      setUserProfile(profile)
      console.log("🔍 [fetchUserProfile] setUserProfile completed")
    } catch (error) {
      console.error("❌ [fetchUserProfile] Error fetching user profile:", error)
      setUserProfile(null)
    }
  }

  const refreshSession = async () => {
    try {
      console.log("🔄 [refreshSession] START - Refreshing session...")

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      console.log("🔄 [refreshSession] getSession result:", { session: !!session, error })

      if (error) {
        console.error("❌ [refreshSession] Error refreshing session:", error)
        return
      }

      // セッション状態を更新
      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        console.log("🔄 [refreshSession] Session found, fetching user profile for:", session.user.id)
        await fetchUserProfile(session.user.id)
        console.log("🔄 [refreshSession] fetchUserProfile completed")
      } else {
        console.log("🔄 [refreshSession] No session found")
        setUserProfile(null)
      }
    } catch (error) {
      console.error("❌ [refreshSession] Error in refreshSession:", error)
    }
  }

  const signOut = async () => {
    try {
      console.log("🚪 [signOut] Starting sign out...")

      // ローカル状態を即座にクリア
      setSession(null)
      setUser(null)
      setUserProfile(null)

      // Supabaseからサインアウト
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ [signOut] Supabase sign out error:", error)
      } else {
        console.log("✅ [signOut] Successfully signed out from Supabase")
      }
    } catch (error) {
      console.error("❌ [signOut] Error during sign out:", error)
    }
  }

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        setLoading(true)

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ Error getting initial session:", error)
          setLoading(false)
          return
        }

        console.log("🔍 Initial session:", session ? "Found" : "Not found")

        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error("❌ Error in getInitialSession:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 認証状態変更リスナー
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, session ? "Session exists" : "No session")

      setSession(session)
      setUser(session?.user || null)

      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserProfile(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUserProfile(null)
      }

      // TOKEN_REFRESHED イベントでもプロファイルを再取得
      if (event === "TOKEN_REFRESHED" && session?.user) {
        console.log("🔄 Token refreshed, updating user profile")
        await fetchUserProfile(session.user.id)
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
