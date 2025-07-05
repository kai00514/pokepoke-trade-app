"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile, createUserProfile, type UserProfile } from "@/lib/services/user-service_ver2"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserProfile = async (userId: string, userEmail: string) => {
    console.log("🔍 [AuthContext] Fetching user profile for:", userId)
    try {
      let profile = await getUserProfile(userId)

      if (!profile) {
        console.log("🔧 [AuthContext] Profile not found, creating new profile")
        profile = await createUserProfile(userId, userEmail)
      }

      console.log("✅ [AuthContext] Profile loaded:", profile)
      setUserProfile(profile)
    } catch (error) {
      console.error("❌ [AuthContext] Error fetching/creating profile:", error)
      setUserProfile(null)
    }
  }

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id, user.email || "")
    }
  }

  useEffect(() => {
    const getSession = async () => {
      console.log("🔍 [AuthContext] Getting initial session...")
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ [AuthContext] Session error:", error)
      }

      console.log("🔍 [AuthContext] Initial session:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      })

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || "")
      }

      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔍 [AuthContext] Auth state changed:", {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
      })

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || "")
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    console.log("🚪 [AuthContext] Signing out...")
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signOut,
        refreshUserProfile,
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
