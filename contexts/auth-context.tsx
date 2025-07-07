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

// シンプルなCookie削除関数
function clearAllCookies() {
  console.log("[auth-context] 🍪 Cookie削除開始")
  console.log("[auth-context] 📋 削除前のCookie:", document.cookie)

  // 現在のすべてのCookieを取得
  const cookies = document.cookie.split(";")

  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()

    if (name) {
      console.log(`[auth-context] 🗑️ Cookie削除: ${name}`)
      // 複数の削除パターンを試行
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
    }
  })

  console.log("[auth-context] 📋 削除後のCookie:", document.cookie)
  console.log("[auth-context] ✅ Cookie削除完了")
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createClient()

  const loadUserProfile = useCallback(
    async (user: User, forceReload = false) => {
      // 既に同じユーザーのプロファイルを読み込み済みで、強制リロードでない場合はスキップ
      if (!forceReload && loadedUserId === user.id && userProfile) {
        console.log("[auth-context] ⏭️ プロファイル読み込みスキップ（既に読み込み済み）:", user.id)
        return
      }

      // 既に読み込み中の場合はスキップ
      if (isLoadingProfile) {
        console.log("[auth-context] ⏭️ プロファイル読み込みスキップ（読み込み中）:", user.id)
        return
      }

      try {
        setIsLoadingProfile(true)
        console.log("[auth-context] 🔄 プロファイル読み込み開始:", user.id)

        let profile = await getUserProfile(user.id)

        if (!profile) {
          console.log("[auth-context] 📝 新規プロファイル作成:", user.email)
          profile = await createUserProfile(user.id, user.email!)
        }

        setUserProfile(profile)
        setLoadedUserId(user.id)
        console.log("[auth-context] ✅ プロファイル読み込み完了:", profile.display_name || profile.pokepoke_id)
      } catch (error) {
        console.error("[auth-context] ❌ プロファイルの読み込みに失敗しました:", error)

        // エラーが発生した場合でも基本的なプロファイルを設定
        const fallbackProfile: UserProfile = {
          id: user.id,
          display_name: user.email?.split("@")[0] || "ユーザー",
          name: user.email?.split("@")[0] || "ユーザー",
          pokepoke_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log("[auth-context] 🆘 フォールバックプロファイルを設定:", fallbackProfile.display_name)
        setUserProfile(fallbackProfile)
        setLoadedUserId(user.id)
      } finally {
        setIsLoadingProfile(false)
      }
    },
    [isLoadingProfile, loadedUserId, userProfile],
  )

  const refreshProfile = useCallback(async () => {
    console.log("[auth-context] 🔄 プロファイル強制更新開始")
    if (user) {
      await loadUserProfile(user, true) // 強制リロードフラグを追加
    }
  }, [user, loadUserProfile])

  const signOut = useCallback(async () => {
    console.log("[auth-context] 🚪 ログアウト処理開始")

    try {
      // 1. 状態を即座にクリア
      console.log("[auth-context] 🧹 状態即座クリア開始...")
      setUser(null)
      setSession(null)
      setUserProfile(null)
      setLoadedUserId(null) // 追加
      setIsLoadingProfile(false) // 追加
      console.log("[auth-context] ✅ 状態即座クリア完了")

      // 2. Cookie削除を先に実行
      console.log("[auth-context] 🔄 Cookie削除処理開始...")
      clearAllCookies()

      // 3. Supabaseからログアウト
      console.log("[auth-context] 🔄 Supabaseログアウト実行中...")
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("[auth-context] ❌ Supabaseログアウトエラー:", error)
      } else {
        console.log("[auth-context] ✅ Supabaseログアウト成功")
      }

      // 4. 再度Cookie削除
      console.log("[auth-context] 🔄 Cookie再削除処理...")
      clearAllCookies()

      // 5. 成功メッセージを表示
      toast({
        title: "ログアウトしました",
        description: "正常にログアウトが完了しました。",
      })

      // 6. ホームページにリダイレクト
      console.log("[auth-context] 🏠 ホームページにリダイレクト中...")
      router.push("/")
      console.log("[auth-context] ✅ ログアウト処理完了")
    } catch (error) {
      console.error("[auth-context] ❌ ログアウト処理中にエラーが発生しました:", error)

      // エラーが発生しても状態クリアとCookie削除は実行
      setUser(null)
      setSession(null)
      setUserProfile(null)
      setLoadedUserId(null)
      setIsLoadingProfile(false)
      clearAllCookies()

      toast({
        title: "ログアウトしました",
        description: "ログアウト処理が完了しました。",
      })

      router.push("/")
    }
  }, [supabase, router])

  useEffect(() => {
    console.log("[auth-context] 🔄 認証状態監視開始")
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[auth-context] 🔔 認証状態変更:", event)

      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        // ユーザーがログインしている場合のみプロファイル読み込み
        if (event === "SIGNED_IN" || (event === "INITIAL_SESSION" && !loadedUserId)) {
          console.log("[auth-context] 👤 ユーザーログイン - プロファイル読み込み:", currentUser.email)
          await loadUserProfile(currentUser)
        }
      } else {
        // ログアウト時の状態クリア
        console.log("[auth-context] 👋 ユーザーログアウト")
        setUserProfile(null)
        setLoadedUserId(null)
        setIsLoadingProfile(false)
      }
    })

    return () => {
      console.log("[auth-context] 🛑 認証状態監視終了")
      subscription.unsubscribe()
    }
  }, [supabase, loadUserProfile, loadedUserId])

  // 状態変更をログ出力
  useEffect(() => {
    console.log("[auth-context] 📊 AuthContext状態変更:", {
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
