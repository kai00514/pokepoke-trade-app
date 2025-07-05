"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile, createUserProfile, type UserProfile } from "@/lib/services/user-service"

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Consolidated function to fetch and set user profile
  const fetchAndSetProfile = async (userId: string, userEmail?: string) => {
    try {
      let profile = await getUserProfile(userId)

      // Create profile if it doesn't exist
      if (!profile && userEmail) {
        profile = await createUserProfile(userId, userEmail)
      }

      setUserProfile(profile)
      return profile
    } catch (error) {
      console.error("Error in fetchAndSetProfile:", error)
      setUserProfile(null)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchAndSetProfile(user.id, user.email || undefined)
    }
  }

  const signOut = async () => {
    try {
      // Clear state immediately
      setUser(null)
      setSession(null)
      setUserProfile(null)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      }
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Initial session error:", error)
          setLoading(false)
          return
        }

        // Set auth state
        setSession(session)
        setUser(session?.user || null)

        // Fetch profile if user exists
        if (session?.user) {
          await fetchAndSetProfile(session.user.id, session.user.email || undefined)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event)

      // Update auth state
      setSession(session)
      setUser(session?.user || null)

      // Handle different auth events
      if (event === "SIGNED_IN" && session?.user) {
        await fetchAndSetProfile(session.user.id, session.user.email || undefined)
      } else if (event === "SIGNED_OUT") {
        setUserProfile(null)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Optionally refresh profile on token refresh
        await fetchAndSetProfile(session.user.id, session.user.email || undefined)
      }

      // Ensure loading is false after auth state change
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    session,
    userProfile,
    loading,
    signOut,
    refreshProfile,
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
