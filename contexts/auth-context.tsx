"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient, refreshClientSession } from "@/lib/supabase/client"
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
    try {
      console.log("🔍 [AuthContext] fetchUserProfile START for:", userId, "email:", userEmail)
      console.log("🔍 [AuthContext] Current auth state:", { hasUser: !!user, hasSession: !!session })

      let profile = await getUserProfile(userId)
      console.log("🔍 [AuthContext] getUserProfile returned:", profile)

      // プロファイルが存在しない場合は作成
      if (!profile && userEmail) {
        console.log("🔧 [AuthContext] Profile not found, creating new profile")
        profile = await createUserProfile(userId, userEmail)
        console.log("🔧 [AuthContext] createUserProfile returned:", profile)
      }

      console.log("🔍 [AuthContext] Final profile result:", profile)
      setUserProfile(profile)
      console.log("✅ [AuthContext] setUserProfile completed")
    } catch (error) {
      console.error("❌ [AuthContext] Error in fetchUserProfile:", error)
      console.error("❌ [AuthContext] Error details:", {
        message: error?.message,
        stack: error?.stack,
        userId,
        userEmail,
      })
      setUserProfile(null)
    }
  }

  const refreshSession = async () => {
    try {
      console.log("🔄 [AuthContext] refreshSession START")

      // Supabaseクライアントのセッションを強制更新
      await refreshClientSession()

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      console.log("🔄 [AuthContext] getSession result:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        error,
      })

      if (error) {
        console.error("❌ [AuthContext] Error refreshing session:", error)
        return
      }

      // セッション状態を更新
      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        console.log("🔄 [AuthContext] Fetching updated user profile")
        await fetchUserProfile(session.user.id, session.user.email)
      } else {
        console.log("🔄 [AuthContext] No session, clearing profile")
        setUserProfile(null)
      }
    } catch (error) {
      console.error("❌ [AuthContext] Error in refreshSession:", error)
    }
  }

  const signOut = async () => {
    try {
      console.log("🚪 [AuthContext] Starting sign out...")

      // ローカル状態を即座にクリア
      setSession(null)
      setUser(null)
      setUserProfile(null)

      // Supabaseからサインアウト
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ [AuthContext] Supabase sign out error:", error)
      } else {
        console.log("✅ [AuthContext] Successfully signed out")
      }
    } catch (error) {
      console.error("❌ [AuthContext] Error during sign out:", error)
    }
  }

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        console.log("🚀 [AuthContext] getInitialSession START")
        setLoading(true)

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        console.log("🔍 [AuthContext] getSession result:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          error,
        })

        if (error) {
          console.error("❌ [AuthContext] Error getting initial session:", error)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          console.log("🔄 [AuthContext] Calling fetchUserProfile from getInitialSession")
          await fetchUserProfile(session.user.id, session.user.email)
        } else {
          console.log("⚠️ [AuthContext] No session or user found in getInitialSession")
        }
      } catch (error) {
        console.error("❌ [AuthContext] Error in getInitialSession:", error)
      } finally {
        console.log("🏁 [AuthContext] getInitialSession completed")
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
        console.log("🔄 [AuthContext] SIGNED_IN event - calling fetchUserProfile")
        // サインイン時にクライアントセッションも更新
        await refreshClientSession()
        await fetchUserProfile(session.user.id, session.user.email)
      } else if (event === "SIGNED_OUT") {
        console.log("🚪 [AuthContext] SIGNED_OUT event - clearing profile")
        setUserProfile(null)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        console.log("🔄 [AuthContext] TOKEN_REFRESHED event")
        await refreshClientSession()
      } else {
        console.log("⚠️ [AuthContext] Unhandled auth event or no user:", event)
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
