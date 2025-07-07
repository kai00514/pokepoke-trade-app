"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile, createUserProfile, clearUserProfileCache } from "@/lib/services/user-service"
import type { UserProfile } from "@/types/user"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function clearAllCookies() {
  console.log("[auth-context] 🍪 Cookie削除開始")
  const cookies = document.cookie.split(";")
  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
    }
  })
  console.log("[auth-context] ✅ Cookie削除完了")
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const router = useRouter()
  const isLoadingProfile = useRef(false)
  const processedUserId = useRef<string | null>(null)
  const supabase = createClient()

  const loadUserProfile = useCallback(async (user: User, forceRefresh = false) => {
    if (!forceRefresh && (isLoadingProfile.current || processedUserId.current === user.id)) {
      console.log("[auth-context] ⏭️ プロファイル読み込みスキップ")
      return
    }

    isLoadingProfile.current = true
    processedUserId.current = user.id
    console.log(`[auth-context] 🔄 プロファイル読み込み開始: userId=${user.id}, forceRefresh=${forceRefresh}`)

    try {
      let profile = await getUserProfile(user.id, forceRefresh)

      if (!profile) {
        console.log("[auth-context] 📝 DBにプロファイルなし。新規作成します。")
        profile = await createUserProfile(user.id, user.email!)
      }

      console.log("[auth-context] ✅ プロファイル読み込み完了:", profile)
      setUserProfile(profile)
    } catch (error) {
      console.error("[auth-context] ❌ プロファイルの読み込みに失敗しました:", error)
      // エラー時もフォールバックプロファイルを設定
      const fallbackProfile: UserProfile = {
        id: user.id,
        display_name: user.email?.split("@")[0] || "ユーザー",
        name: user.email?.split("@")[0] || "ユーザー",
        pokepoke_id: null,
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setUserProfile(fallbackProfile)
    } finally {
      isLoadingProfile.current = false
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    console.log("[auth-context] 🔄 プロファイル強制更新開始")
    if (user) {
      await loadUserProfile(user, true)
    }
  }, [user, loadUserProfile])

  const signOut = useCallback(async () => {
    console.log("[auth-context] 🚪 ログアウト処理開始")

    // 状態とキャッシュを即座にクリア
    setUser(null)
    setSession(null)
    setUserProfile(null)
    processedUserId.current = null
    clearUserProfileCache()

    // SupabaseからのログアウトとCookie削除
    await supabase.auth.signOut()
    clearAllCookies()

    toast({ title: "ログアウトしました" })
    router.push("/")
    console.log("[auth-context] ✅ ログアウト処理完了")
  }, [supabase, router])

  // プロファイル更新イベントのリスナー
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log("[auth-context] 📢 プロファイル更新イベント受信:", event.detail)
      setUserProfile(event.detail)
    }
    window.addEventListener("profileUpdated", handleProfileUpdate as EventListener)
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    console.log("[auth-context] 🔔 認証状態監視リスナー設定")
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[auth-context] ✨ 認証状態変更: ${event}`, { hasSession: !!session })

      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === "SIGNED_IN" && currentUser) {
        console.log("[auth-context] 👤 ログイン検知:", currentUser.email)
        await loadUserProfile(currentUser, true) // ログイン時は強制リフレッシュ
      } else if (event === "INITIAL_SESSION" && currentUser) {
        console.log("[auth-context] 👤 セッション復元:", currentUser.email)
        await loadUserProfile(currentUser) // 通常はキャッシュから
      } else if (event === "SIGNED_OUT") {
        console.log("[auth-context] 👋 ログアウト検知")
        setUserProfile(null)
        processedUserId.current = null
        clearUserProfileCache()
      }
    })

    return () => {
      console.log("[auth-context] 🛑 認証状態監視終了")
      subscription.unsubscribe()
    }
  }, [supabase, loadUserProfile])

  useEffect(() => {
    console.log("[auth-context] 📊 AuthContext状態変更:", {
      user: user ? user.email : null,
      userProfile: userProfile ? { name: userProfile.display_name, avatar: !!userProfile.avatar_url } : null,
    })
  }, [user, userProfile])

  return (
    <AuthContext.Provider value={{ user, session, userProfile, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthはAuthProvider内で使用する必要があります")
  }
  return context
}
