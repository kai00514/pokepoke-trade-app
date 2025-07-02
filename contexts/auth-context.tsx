"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, SupabaseClient, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile } from "@/lib/services/user-service"

interface UserProfile {
  id: string
  name?: string
  pokepoke_id?: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  session: Session | null
  user: User | null
  userProfile: UserProfile | null
  displayName: string
  signOut: () => Promise<void>
  supabase: SupabaseClient
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState<string>("")

  const supabase = createClient()

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        console.log("🔍 Fetching user profile for:", userId)
        const profile = await getUserProfile(userId)
        setUserProfile(profile)

        // 表示名の優先順位: name > display_name > pokepoke_id > email
        const currentUser = await supabase.auth.getUser()
        const email = currentUser.data.user?.email
        const name =
          profile?.name || profile?.display_name || profile?.pokepoke_id || email?.split("@")[0] || "ユーザー"
        setDisplayName(name)

        console.log("👤 User profile loaded:", { profile, displayName: name })
      } catch (error) {
        console.error("❌ Error fetching user profile:", error)
        // プロファイル取得に失敗してもユーザーのメールアドレスから表示名を設定
        const currentUser = await supabase.auth.getUser()
        const email = currentUser.data.user?.email
        setDisplayName(email?.split("@")[0] || "ユーザー")
      }
    },
    [supabase.auth],
  )

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ Error refreshing session:", error)
        setSession(null)
        setUser(null)
        setUserProfile(null)
        setDisplayName("")
        return
      }

      setSession(newSession)
      if (newSession?.user) {
        setUser(newSession.user)
        await fetchUserProfile(newSession.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
        setDisplayName("")
      }
    } catch (error) {
      console.error("❌ Error in refreshSession:", error)
      setSession(null)
      setUser(null)
      setUserProfile(null)
      setDisplayName("")
    }
  }, [supabase, fetchUserProfile])

  useEffect(() => {
    let mounted = true

    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("❌ Error getting initial session:", error)
          return
        }

        console.log("🔄 Initial session:", session ? "found" : "not found")
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error("❌ Error in getInitialSession:", error)
      }
    }

    getInitialSession()

    // 認証状態変更の監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      console.log("🔄 Auth state changed:", event, newSession ? "session exists" : "no session")

      try {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id)
        } else {
          setUserProfile(null)
          setDisplayName("")
        }
      } catch (error) {
        console.error("❌ Error in onAuthStateChange:", error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setUserProfile(null)
          setDisplayName("")
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile, supabase.auth])

  const signOut = async () => {
    try {
      console.log("🔄 Starting sign out process...")

      // 即座にローカル状態をクリア
      setSession(null)
      setUser(null)
      setUserProfile(null)
      setDisplayName("")

      // Supabaseからサインアウト
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Sign out error:", error)
        // エラーが発生してもローカル状態はクリア済み
      }

      console.log("✅ Signed out successfully")
    } catch (error) {
      console.error("❌ Error during sign out:", error)
      // エラーが発生してもローカル状態はクリア済み
    }
  }

  const value = {
    session,
    user,
    userProfile,
    displayName,
    signOut,
    supabase,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
