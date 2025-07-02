"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile } from "@/lib/services/user-service"

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
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const supabase = createClient()

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("🔍 Fetching user profile for:", userId)
      const profile = await getUserProfile(userId)
      console.log("🔍 Fetched user profile:", profile)
      setUserProfile(profile)
    } catch (error) {
      console.error("❌ Error fetching user profile:", error)
      setUserProfile(null)
    }
  }

  const refreshSession = async () => {
    try {
      console.log("🔄 Refreshing session...")
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ Error refreshing session:", error)
        return
      }

      if (session?.user) {
        console.log("🔄 Session refreshed, fetching user profile...")
        await fetchUserProfile(session.user.id)
      }
    } catch (error) {
      console.error("❌ Error in refreshSession:", error)
    }
  }

  const signOut = async () => {
    try {
      console.log("🚪 Starting sign out...")

      // ローカル状態を即座にクリア
      setSession(null)
      setUser(null)
      setUserProfile(null)

      // Supabaseからサインアウト
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Supabase sign out error:", error)
      } else {
        console.log("✅ Successfully signed out from Supabase")
      }
    } catch (error) {
      console.error("❌ Error during sign out:", error)
    }
  }

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ Error getting initial session:", error)
          return
        }

        console.log("🔍 Initial session:", session ? "Found" : "Not found")

        if (session) {
          setSession(session)
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error("❌ Error in getInitialSession:", error)
      }
    }

    getInitialSession()

    // 認証状態変更リスナー
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, session ? "Session exists" : "No session")

      if (event === "SIGNED_IN" && session) {
        setSession(session)
        setUser(session.user)
        await fetchUserProfile(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setSession(null)
        setUser(null)
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
