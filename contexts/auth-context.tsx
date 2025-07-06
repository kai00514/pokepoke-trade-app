"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getUserProfile, createUserProfile } from "@/lib/services/user-service"
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

// Cookie削除のヘルパー関数
function clearSupabaseCookies() {
  console.log("🍪 Cookie削除開始")

  // 現在のCookieを取得して確認
  const currentCookies = document.cookie.split(";").map((cookie) => cookie.trim())
  console.log("📋 現在のCookie:", currentCookies)

  // Supabase関連のCookieを特定して削除
  currentCookies.forEach((cookie) => {
    const [name] = cookie.split("=")
    if (name && (name.includes("sb-") || name.includes("supabase"))) {
      console.log("🗑️ Cookie削除対象:", name)

      // 複数のパスとドメインで削除を試行
      const deleteVariations = [
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`,
      ]

      deleteVariations.forEach((deleteString) => {
        document.cookie = deleteString
      })
    }
  })

  // よく知られているSupabase Cookieキーも明示的に削除
  const knownSupabaseCookies = ["sb-access-token", "sb-refresh-token", "supabase-auth-token", "supabase.auth.token"]

  knownSupabaseCookies.forEach((cookieName) => {
    console.log("🗑️ 明示的Cookie削除:", cookieName)
    const deleteVariations = [
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`,
    ]

    deleteVariations.forEach((deleteString) => {
      document.cookie = deleteString
    })
  })

  // 削除後のCookieを確認
  const afterCookies = document.cookie.split(";").map((cookie) => cookie.trim())
  console.log("📋 削除後のCookie:", afterCookies)
  console.log("✅ Cookie削除完了")
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const router = useRouter()

  const supabase = createClient()

  const loadUserProfile = useCallback(async (user: User) => {
    try {
      console.log("🔄 プロファイル読み込み開始:", user.id)
      let profile = await getUserProfile(user.id)
      if (!profile) {
        console.log("📝 新規プロファイル作成:", user.email)
        profile = await createUserProfile(user.id, user.email!)
      }
      setUserProfile(profile)
      console.log("✅ プロファイル読み込み完了:", profile)
    } catch (error) {
      console.error("❌ プロファイルの読み込みに失敗しました:", error)
      setUserProfile(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    console.log("🔄 プロファイル更新開始")
    if (user) {
      await loadUserProfile(user)
    }
  }, [user, loadUserProfile])

  const signOut = useCallback(async () => {
    console.log("🚪 ログアウト処理開始")
    console.log("📊 ログアウト前の状態:", { user: !!user, session: !!session, userProfile: !!userProfile })

    try {
      // 1. 状態を即座にクリア（UIの即座な更新のため）
      console.log("🧹 状態即座クリア開始...")
      setUser(null)
      setSession(null)
      setUserProfile(null)
      console.log("✅ 状態即座クリア完了")

      // 2. Supabaseからログアウト（シンプルに実行）
      console.log("🔄 Supabaseログアウト実行中...")
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("❌ Supabaseログアウトエラー:", error)
        // エラーが発生してもCookie削除は実行
      } else {
        console.log("✅ Supabaseログアウト成功")
      }

      // 3. Cookie削除（Supabaseログアウトの結果に関わらず実行）
      clearSupabaseCookies()

      // 4. 成功メッセージを表示
      toast({
        title: "ログアウトしました",
        description: "正常にログアウトが完了しました。",
      })

      // 5. ホームページにリダイレクト
      console.log("🏠 ホームページにリダイレクト中...")
      router.push("/")
      console.log("✅ ログアウト処理完了")
    } catch (error) {
      console.error("❌ ログアウト処理中にエラーが発生しました:", error)

      // エラーが発生しても状態クリアとCookie削除は実行
      setUser(null)
      setSession(null)
      setUserProfile(null)
      clearSupabaseCookies()

      toast({
        title: "ログアウトしました",
        description: "ログアウト処理が完了しました。",
      })

      router.push("/")
    }
  }, [supabase, router, user, session, userProfile])

  useEffect(() => {
    console.log("🔄 認証状態監視開始")
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 認証状態変更:", event, { session: !!session })

      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        console.log("👤 ユーザーログイン:", currentUser.email)
        await loadUserProfile(currentUser)
      } else {
        console.log("👋 ユーザーログアウト")
        setUserProfile(null)
      }

      console.log("📊 認証状態更新完了:", {
        user: !!currentUser,
        session: !!session,
        userProfile: userProfile ? "loaded" : "null",
      })
    })

    return () => {
      console.log("🛑 認証状態監視終了")
      subscription.unsubscribe()
    }
  }, [supabase, loadUserProfile])

  // 状態変更をログ出力
  useEffect(() => {
    console.log("📊 AuthContext状態変更:", {
      user: user ? user.email : null,
      session: !!session,
      userProfile: userProfile ? userProfile.display_name || userProfile.pokepoke_id : null,
    })
  }, [user, session, userProfile])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        signOut,
        refreshProfile,
      }}
    >
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
