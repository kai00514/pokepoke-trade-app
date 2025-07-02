"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

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
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  displayName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // 表示名の優先順位: name > display_name > pokepoke_id > email
  const displayName =
    userProfile?.name ||
    userProfile?.display_name ||
    userProfile?.pokepoke_id ||
    user?.email?.split("@")[0] ||
    "ユーザー"

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("📡 Fetching user profile for:", userId)
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("❌ Error fetching user profile:", error)
        return null
      }

      console.log("✅ User profile fetched:", data)
      return data
    } catch (error) {
      console.error("❌ Exception fetching user profile:", error)
      return null
    }
  }

  const signOut = async () => {
    try {
      console.log("🚪 Starting sign out process...")

      // Supabaseからサインアウト
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("❌ Supabase sign out error:", error)
        throw error
      }

      // ローカル状態をクリア
      setUser(null)
      setUserProfile(null)

      console.log("✅ Sign out completed successfully")
    } catch (error) {
      console.error("❌ Sign out failed:", error)
      throw error
    }
  }

  useEffect(() => {
    console.log("🔄 AuthProvider: Setting up auth state listener")

    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ Error getting initial session:", error)
          setLoading(false)
          return
        }

        console.log("📋 Initial session:", session ? "Found" : "None")

        if (session?.user) {
          setUser(session.user)
          const profile = await fetchUserProfile(session.user.id)
          setUserProfile(profile)
        } else {
          setUser(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error("❌ Exception getting initial session:", error)
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

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        const profile = await fetchUserProfile(session.user.id)
        setUserProfile(profile)
      } else if (event === "SIGNED_OUT" || !session) {
        setUser(null)
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => {
      console.log("🧹 AuthProvider: Cleaning up auth listener")
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    userProfile,
    loading,
    signOut,
    displayName,
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
