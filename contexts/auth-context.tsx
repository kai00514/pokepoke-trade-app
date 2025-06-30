"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import type { User, SupabaseClient, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client" // createClient をインポート
import { getUserProfile } from "@/lib/services/user-service"

interface UserProfile {
  id: string
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
  loading: boolean
  displayName: string
  signOut: () => Promise<void>
  supabase: SupabaseClient // supabaseクライアントを追加
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string>("")
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // setIsLoading をここで宣言

  const supabase = createClient() // Supabaseクライアントをここで作成
  const searchParams = useSearchParams()

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        console.log("🔍 Fetching user profile for:", userId)
        const profile = await getUserProfile(userId)
        setUserProfile(profile)

        // 表示名の優先順位: display_name > pokepoke_id > email
        const currentUser = await supabase.auth.getUser()
        const email = currentUser.data.user?.email
        const name = profile?.display_name || profile?.pokepoke_id || email?.split("@")[0] || "ユーザー"
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
    setIsLoading(true)
    const {
      data: { session: newSession },
      error,
    } = await supabase.auth.getSession()
    if (error) {
      console.error("Error refreshing session:", error)
      setSession(null)
      setUser(null)
      setUserProfile(null)
      setDisplayName("")
    } else {
      setSession(newSession)
      if (newSession?.user) {
        setUser(newSession.user)
        await fetchUserProfile(newSession.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
        setDisplayName("")
      }
    }
    setIsLoading(false)
  }, [supabase, fetchUserProfile])

  useEffect(() => {
    // 初期化を実行
    refreshSession()

    // 認証状態変更の監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        setUser(newSession.user)
        fetchUserProfile(newSession.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
        setDisplayName("")
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshSession, fetchUserProfile, supabase.auth])

  // URLパラメータのcodeを処理（初期化後）
  useEffect(() => {
    if (!isInitialized) return

    const handleCodeParameter = async () => {
      const code = searchParams.get("code")
      if (code) {
        console.log("🔐 Processing code parameter:", code)
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error("❌ Code exchange error:", error)
          } else if (data.session) {
            console.log("✅ Code exchanged successfully for user:", data.session.user.email)
            setSession(data.session)
            setUser(data.session.user)
            await fetchUserProfile(data.session.user.id)
            setLoading(false)

            // URLからcodeパラメータを削除
            const url = new URL(window.location.href)
            url.searchParams.delete("code")
            window.history.replaceState({}, "", url.toString())
          }
        } catch (error) {
          console.error("❌ Error processing code:", error)
        }
      }
    }

    handleCodeParameter()
  }, [searchParams, isInitialized, supabase.auth, fetchUserProfile])

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("❌ Sign out error:", error)
        throw error
      }

      setSession(null)
      setUser(null)
      setUserProfile(null)
      setDisplayName("")
      console.log("✅ Signed out successfully")
    } catch (error) {
      console.error("❌ Error during sign out:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    session,
    user,
    userProfile,
    loading,
    displayName,
    signOut,
    supabase, // supabaseクライアントをコンテキストの値に含める
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
