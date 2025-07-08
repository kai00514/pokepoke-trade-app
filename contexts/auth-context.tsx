"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import {
  getUserProfile,
  createUserProfile,
  clearCachedProfile,
  createFallbackProfile,
} from "@/lib/services/user-service"
import type { UserProfile } from "@/types/user"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  isLoading: boolean
  displayName: string
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

// セッションの完全性を確認する関数
function isSessionComplete(session: Session | null): boolean {
  return !!(session && session.access_token && session.user && session.user.id && session.user.email)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // 重複防止とタイムアウト制御
  const isProfileLoadingRef = useRef(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const backgroundRetryCount = useRef(0)
  const isInitialized = useRef(false)

  const router = useRouter()

  const handleProfileLoad = useCallback(async (user: User, isBackgroundRetry = false) => {
    // 既に取得中の場合はスキップ（バックグラウンド再取得は除く）
    if (isProfileLoadingRef.current && !isBackgroundRetry) {
      console.log("🔄 Profile loading already in progress, skipping...")
      return
    }

    // バックグラウンド再取得の回数制限
    if (isBackgroundRetry && backgroundRetryCount.current >= 2) {
      console.log("🚫 Background retry limit reached")
      return
    }

    isProfileLoadingRef.current = true

    // 3秒でローディングタイムアウト（短縮）
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    loadingTimeoutRef.current = setTimeout(() => {
      if (isProfileLoadingRef.current) {
        console.log("⏰ Profile loading timeout (3s), using fallback")
        const fallbackProfile = createFallbackProfile(user)
        setUserProfile(fallbackProfile)
        setIsLoading(false)
        isProfileLoadingRef.current = false

        // バックグラウンドで再取得を試行
        if (backgroundRetryCount.current < 2) {
          backgroundRetryCount.current++
          console.log(`🔄 Starting background retry ${backgroundRetryCount.current}/2`)
          setTimeout(() => {
            handleProfileLoad(user, true)
          }, 2000) // 2秒後に再試行
        }
      }
    }, 3000) // 3秒に短縮

    try {
      console.log(`🚀 Starting profile load for user: ${user.id} (background: ${isBackgroundRetry})`)

      let profile = await getUserProfile(user.id)

      if (!profile) {
        console.log("👤 No profile found, creating new profile...")
        profile = await createUserProfile(user.id, user.email!)
      }

      console.log("✅ Profile loaded successfully:", profile.display_name)
      setUserProfile(profile)

      if (isBackgroundRetry) {
        console.log("🎉 Background retry successful")
        backgroundRetryCount.current = 0 // 成功したらカウントリセット
      }
    } catch (error) {
      console.error(`❌ Profile load error (background: ${isBackgroundRetry}):`, error)

      if (!isBackgroundRetry) {
        // 初回エラーの場合のみトーストとフォールバック表示
        const fallbackProfile = createFallbackProfile(user)
        setUserProfile(fallbackProfile)

        toast({
          title: "プロファイルの取得に失敗しました",
          description: "基本情報で表示しています。バックグラウンドで再取得を試行中です。",
          variant: "destructive",
        })

        // バックグラウンドで再取得を開始
        if (backgroundRetryCount.current < 2) {
          backgroundRetryCount.current++
          setTimeout(() => {
            handleProfileLoad(user, true)
          }, 3000) // 3秒後に再試行
        }
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      isProfileLoadingRef.current = false
      if (!isBackgroundRetry) {
        setIsLoading(false)
      }
    }
  }, [])

  // 初期化順序の最適化
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("🔧 Initializing authentication...")

      try {
        // 1. セッション取得
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ Failed to get initial session:", error)
          setIsLoading(false)
          return
        }

        // 2. 認証状態確認
        if (isSessionComplete(session)) {
          console.log("✅ Complete session found, loading profile immediately")
          setSession(session)
          setUser(session.user)
          setCurrentUserId(session.user.id)

          // 3. プロファイル取得
          await handleProfileLoad(session.user)
        } else {
          console.log("ℹ️ No complete session found")
          setIsLoading(false)
        }

        isInitialized.current = true
      } catch (error) {
        console.error("❌ Auth initialization error:", error)
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [handleProfileLoad])

  // 認証状態の監視（INITIAL_SESSIONのみ処理）
  useEffect(() => {
    console.log("🔧 Setting up auth state listener...")

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔐 Auth state change: ${event}`)

      // SIGNED_INイベントを完全にスキップ
      if (event === "SIGNED_IN") {
        console.log("⏭️ Skipping SIGNED_IN event - using INITIAL_SESSION only")
        return
      }

      // 初期化完了前のINITIAL_SESSIONもスキップ
      if (event === "INITIAL_SESSION" && !isInitialized.current) {
        console.log("⏭️ Skipping INITIAL_SESSION - already handled in initialization")
        return
      }

      setIsLoading(true)
      setSession(session)
      const currentUser = session?.user ?? null

      // ユーザーIDが変更された場合のみ処理を実行
      if (currentUser?.id !== currentUserId) {
        console.log(`👤 User changed: ${currentUserId} -> ${currentUser?.id}`)

        setUser(currentUser)
        setCurrentUserId(currentUser?.id ?? null)
        backgroundRetryCount.current = 0 // 新しいユーザーの場合はリトライカウントリセット

        if (currentUser && isSessionComplete(session)) {
          // INITIAL_SESSIONでセッションが完全な場合のみプロファイルを取得
          if (event === "INITIAL_SESSION") {
            await handleProfileLoad(currentUser)
          }
        } else {
          // ログアウト時
          console.log("👋 User logged out, clearing profile")
          setUserProfile(null)
          setIsLoading(false)
        }
      } else {
        // 同じユーザーの場合はローディング状態のみ更新
        setIsLoading(false)
      }
    })

    return () => {
      console.log("🧹 Cleaning up auth listener")
      authListener.subscription.unsubscribe()
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [currentUserId, handleProfileLoad])

  const signOut = useCallback(async () => {
    console.log("👋 Signing out...")
    if (user) clearCachedProfile(user.id)
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setUserProfile(null)
    setCurrentUserId(null)
    backgroundRetryCount.current = 0
    isInitialized.current = false
    clearAllCookies()
    router.push("/")
  }, [router, user])

  const refreshProfile = useCallback(async () => {
    if (user) {
      console.log("🔄 Refreshing profile...")
      setIsLoading(true)
      clearCachedProfile(user.id)
      backgroundRetryCount.current = 0
      await handleProfileLoad(user)
    }
  }, [user, handleProfileLoad])

  const displayName = useMemo(() => {
    if (userProfile?.display_name) {
      return userProfile.display_name
    }
    if (user?.email) {
      return user.email.split("@")[0]
    }
    return "ユーザー"
  }, [userProfile, user])

  const contextValue = useMemo(
    () => ({
      user,
      session,
      userProfile,
      isLoading,
      displayName,
      signOut,
      refreshProfile,
    }),
    [user, session, userProfile, isLoading, displayName, signOut, refreshProfile],
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
