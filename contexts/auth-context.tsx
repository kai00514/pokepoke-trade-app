"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile, createUserProfile, type UserProfile } from "@/lib/services/user-service_ver2"

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
  const [mounted, setMounted] = useState(false)

  const supabase = createClient()

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    if (!mounted) return

    console.log("🔍 [AuthContext] fetchUserProfile START for:", userId, "email:", userEmail)
    console.log("🔍 [AuthContext] Current auth state:", {
      hasUser: !!user,
      hasSession: !!session,
    })

    try {
      console.log("🔍 [AuthContext] Calling getUserProfile...")
      let profile = await getUserProfile(userId)

      console.log("🔍 [AuthContext] getUserProfile returned:", {
        hasProfile: !!profile,
        profileId: profile?.id,
        profileName: profile?.display_name,
      })

      // プロファイルが存在しない場合は作成
      if (!profile && userEmail) {
        console.log("🔧 [AuthContext] Profile not found, creating new profile")
        profile = await createUserProfile(userId, userEmail)
        console.log("🔧 [AuthContext] createUserProfile returned:", {
          hasProfile: !!profile,
          profileId: profile?.id,
        })
      }

      if (mounted) {
        console.log("🔍 [AuthContext] Setting user profile:", profile)
        setUserProfile(profile)
      }
    } catch (error) {
      console.error("❌ [AuthContext] Error in fetchUserProfile:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        userEmail,
      })
      if (mounted) {
        setUserProfile(null)
      }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id, user.email)
    }
  }

  const signOut = async () => {
    console.log("🚪 [AuthContext] Signing out...")
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ [AuthContext] Sign out error:", error)
        throw error
      }
      console.log("✅ [AuthContext] Signed out successfully")
    } catch (error) {
      console.error("❌ [AuthContext] Sign out failed:", error)
      throw error
    }
  }

  useEffect(() => {
    setMounted(true)

    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        setLoading(true)
        console.log("🚀 [AuthContext] getInitialSession START")

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

        if (mounted) {
          setSession(session)
          setUser(session?.user || null)

          if (session?.user) {
            await fetchUserProfile(session.user.id, session.user.email)
          }
        }
      } catch (error) {
        console.error("❌ [AuthContext] Error in getInitialSession:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
      } finally {
        if (mounted) {
          setLoading(false)
        }
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

      if (mounted) {
        setSession(session)
        setUser(session?.user || null)

        try {
          if (event === "SIGNED_IN" && session?.user) {
            console.log("🔄 [AuthContext] SIGNED_IN event - calling fetchUserProfile")
            console.log("🔄 [AuthContext] About to call fetchUserProfile directly")
            await fetchUserProfile(session.user.id, session.user.email)
          } else if (event === "SIGNED_OUT") {
            console.log("🔄 [AuthContext] SIGNED_OUT event - clearing profile")
            setUserProfile(null)
          }

          if (event === "TOKEN_REFRESHED" && session?.user) {
            console.log("🔄 [AuthContext] TOKEN_REFRESHED event")
            // トークン更新時はプロファイル再取得は不要
          }
        } catch (error) {
          console.error("❌ [AuthContext] Error in auth state change handler:", {
            event,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
        }
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      setMounted(false)
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
