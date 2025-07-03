"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// ユーザープロファイルの型定義
interface UserProfile {
  display_name?: string
  pokepoke_id?: string
  name?: string
  avatar_url?: string
  [key: string]: any
}

// AuthContextの型定義
interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  isLoading: boolean
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>
  signOut: () => Promise<void>
}

// AuthContextの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Supabaseクライアントのシングルトンインスタンス
let supabase: SupabaseClient | null = null

const getSupabaseClient = () => {
  if (!supabase) {
    supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }
  return supabase
}

// AuthProviderコンポーネント
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log("🔍 [AuthProvider] Fetching user profile for:", userId)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("❌ [AuthProvider] Error fetching profile:", error)
      return null
    }
    console.log("✅ [AuthProvider] Profile fetched:", data)
    return data
  }, [])

  const handleAuthStateChange = useCallback(
    async (event: string, session: any) => {
      console.log(`🔄 [AuthProvider] Auth state changed: ${event}`)
      setIsLoading(true)
      if (session) {
        setUser(session.user)
        const profile = await fetchUserProfile(session.user.id)
        setUserProfile(profile)
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setIsLoading(false)
    },
    [fetchUserProfile],
  )

  useEffect(() => {
    const supabase = getSupabaseClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // 初回セッション取得
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      handleAuthStateChange("INITIAL_SESSION", session)
    }
    getInitialSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [handleAuthStateChange])

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error("ユーザーが認証されていません。")

    console.log("🔧 [AuthProvider] Updating profile with:", profileData)
    const response = await fetch("/api/users/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, profileData }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ [AuthProvider] API update failed:", errorData)
      throw new Error(errorData.error || "プロファイルの更新に失敗しました。")
    }

    const { data: updatedProfile } = await response.json()
    console.log("✅ [AuthProvider] Profile updated, new data:", updatedProfile)
    setUserProfile(updatedProfile)
  }

  const signOut = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, isLoading, updateUserProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// useAuthフック
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
