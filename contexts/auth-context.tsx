"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { getUserProfile, createUserProfile, clearCachedProfile } from "@/lib/services/user-service"
import type { UserProfile } from "@/types/user"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function clearAllCookies() {
  const cookies = document.cookie.split(";")
  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    }
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()

  const handleProfileLoad = useCallback(async (user: User) => {
    try {
      let profile = await getUserProfile(user.id)
      if (!profile) {
        profile = await createUserProfile(user.id, user.email!)
      }
      setUserProfile(profile)
    } catch (error) {
      console.error("Profile load error:", error)
      toast({
        title: "プロファイルの取得に失敗しました",
        description: "時間をおいてからページを再読み込みしてください。",
        variant: "destructive",
      })
      setUserProfile(null)
    }
  }, [])

  // 認証状態の監視を一度だけ設定
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event)

      setIsLoading(true)
      setSession(session)
      const currentUser = session?.user ?? null

      // ユーザーIDが変更された場合のみ処理を実行
      if (currentUser?.id !== currentUserId) {
        setUser(currentUser)
        setCurrentUserId(currentUser?.id ?? null)

        if (currentUser) {
          // INITIAL_SESSIONまたはSIGNED_INの場合にプロファイルを取得
          if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
            await handleProfileLoad(currentUser)
          }
        } else {
          // ログアウト時
          setUserProfile(null)
        }
      }

      setIsLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, []) // 依存配列を空にして一度だけ実行

  const signOut = useCallback(async () => {
    if (user) clearCachedProfile(user.id)
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setUserProfile(null)
    setCurrentUserId(null)
    clearAllCookies()
    router.push("/")
  }, [router, user])

  const refreshProfile = useCallback(async () => {
    if (user) {
      setIsLoading(true)
      clearCachedProfile(user.id)
      await handleProfileLoad(user)
      setIsLoading(false)
    }
  }, [user, handleProfileLoad])

  const contextValue = useMemo(
    () => ({
      user,
      session,
      userProfile,
      isLoading,
      signOut,
      refreshProfile,
    }),
    [user, session, userProfile, isLoading, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthはAuthProvider内で使用する必要があります")
  }
  return context
}
