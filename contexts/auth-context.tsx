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

// Cookie削除のヘルパー関数（複数の方法を試行）
function clearSupabaseCookies() {
  console.log("🍪 Cookie削除開始")

  // 現在のCookieを取得して確認
  const currentCookies = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
  console.log("📋 削除前のCookie一覧:", currentCookies)
  console.log("📋 削除前のCookie文字列:", document.cookie)

  // Supabase関連のCookieを特定
  const supabaseCookies = currentCookies.filter((cookie) => {
    const [name] = cookie.split("=")
    return name && (name.includes("sb-") || name.includes("supabase"))
  })

  console.log("🎯 Supabase関連Cookie:", supabaseCookies)

  if (supabaseCookies.length === 0) {
    console.log("ℹ️ Supabase関連のCookieが見つかりません")
  }

  // 方法1: 基本的な削除
  console.log("🔄 方法1: 基本的な削除を試行")
  supabaseCookies.forEach((cookie) => {
    const [name] = cookie.split("=")
    if (name) {
      console.log(`  🗑️ 基本削除: ${name}`)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  })

  // 方法2: パス指定削除
  console.log("🔄 方法2: パス指定削除を試行")
  supabaseCookies.forEach((cookie) => {
    const [name] = cookie.split("=")
    if (name) {
      console.log(`  🗑️ パス指定削除: ${name}`)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  })

  // 方法3: ドメイン指定削除
  console.log("🔄 方法3: ドメイン指定削除を試行")
  const hostname = window.location.hostname
  console.log(`  🌐 現在のホスト名: ${hostname}`)

  supabaseCookies.forEach((cookie) => {
    const [name] = cookie.split("=")
    if (name) {
      console.log(`  🗑️ ドメイン指定削除: ${name}`)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${hostname}`
    }
  })

  // 方法4: セキュア属性付き削除
  console.log("🔄 方法4: セキュア属性付き削除を試行")
  supabaseCookies.forEach((cookie) => {
    const [name] = cookie.split("=")
    if (name) {
      console.log(`  🗑️ セキュア削除: ${name}`)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}; secure`
    }
  })

  // 方法5: SameSite属性付き削除
  console.log("🔄 方法5: SameSite属性付き削除を試行")
  supabaseCookies.forEach((cookie) => {
    const [name] = cookie.split("=")
    if (name) {
      console.log(`  🗑️ SameSite削除: ${name}`)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=None; secure`
    }
  })

  // 方法6: Max-Age使用削除
  console.log("🔄 方法6: Max-Age使用削除を試行")
  supabaseCookies.forEach((cookie) => {
    const [name] = cookie.split("=")
    if (name) {
      console.log(`  🗑️ Max-Age削除: ${name}`)
      document.cookie = `${name}=; Max-Age=0; path=/`
      document.cookie = `${name}=; Max-Age=-1; path=/`
    }
  })

  // 方法7: 全属性組み合わせ削除
  console.log("🔄 方法7: 全属性組み合わせ削除を試行")
  supabaseCookies.forEach((cookie) => {
    const [name] = cookie.split("=")
    if (name) {
      console.log(`  🗑️ 全属性削除: ${name}`)
      const deleteVariations = [
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}; secure; SameSite=Lax`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${hostname}; secure; SameSite=Lax`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}; SameSite=Strict`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${hostname}; SameSite=Strict`,
        `${name}=; Max-Age=0; path=/; domain=${hostname}; secure; SameSite=None`,
        `${name}=; Max-Age=0; path=/; domain=.${hostname}; secure; SameSite=None`,
      ]

      deleteVariations.forEach((deleteString, index) => {
        console.log(`    🔸 バリエーション${index + 1}: ${deleteString}`)
        document.cookie = deleteString
      })
    }
  })

  // よく知られているSupabase Cookieキーも明示的に削除
  const knownSupabaseCookies = [
    "sb-access-token",
    "sb-refresh-token",
    "supabase-auth-token",
    "supabase.auth.token",
    "sb-localhost-auth-token",
    "sb-127-0-0-1-auth-token",
  ]

  console.log("🔄 既知のSupabase Cookieキーを明示的削除")
  knownSupabaseCookies.forEach((cookieName) => {
    console.log(`  🗑️ 既知Cookie削除: ${cookieName}`)
    const deleteVariations = [
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${hostname}`,
      `${cookieName}=; Max-Age=0; path=/`,
      `${cookieName}=; Max-Age=0; path=/; domain=${hostname}`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure`,
      `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}; secure; SameSite=Lax`,
    ]

    deleteVariations.forEach((deleteString, index) => {
      console.log(`    🔸 既知Cookie バリエーション${index + 1}: ${deleteString}`)
      document.cookie = deleteString
    })
  })

  // 削除後のCookieを確認
  setTimeout(() => {
    const afterCookies = document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
    console.log("📋 削除後のCookie一覧:", afterCookies)
    console.log("📋 削除後のCookie文字列:", document.cookie)

    const remainingSupabaseCookies = afterCookies.filter((cookie) => {
      const [name] = cookie.split("=")
      return name && (name.includes("sb-") || name.includes("supabase"))
    })

    if (remainingSupabaseCookies.length > 0) {
      console.warn("⚠️ まだ残っているSupabase Cookie:", remainingSupabaseCookies)
    } else {
      console.log("✅ すべてのSupabase Cookieが削除されました")
    }

    console.log("✅ Cookie削除処理完了")
  }, 100)
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
    console.log("🌐 現在のURL:", window.location.href)
    console.log("🌐 現在のホスト:", window.location.hostname)
    console.log("🌐 現在のプロトコル:", window.location.protocol)

    try {
      // 1. 状態を即座にクリア（UIの即座な更新のため）
      console.log("🧹 状態即座クリア開始...")
      setUser(null)
      setSession(null)
      setUserProfile(null)
      console.log("✅ 状態即座クリア完了")

      // 2. Supabaseからログアウト（シンプルに実行）
      console.log("🔄 Supabaseログアウト実行中...")
      const logoutResult = await supabase.auth.signOut()
      console.log("📊 Supabaseログアウト結果:", logoutResult)

      if (logoutResult.error) {
        console.error("❌ Supabaseログアウトエラー:", logoutResult.error)
        console.error("❌ エラー詳細:", {
          message: logoutResult.error.message,
          status: logoutResult.error.status,
          statusText: logoutResult.error.statusText,
        })
        // エラーが発生してもCookie削除は実行
      } else {
        console.log("✅ Supabaseログアウト成功")
      }

      // 3. Cookie削除（Supabaseログアウトの結果に関わらず実行）
      console.log("🔄 Cookie削除処理開始...")
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
      console.error("❌ エラーの詳細:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      // エラーが発生しても状態クリアとCookie削除は実行
      setUser(null)
      setSession(null)
      setUserProfile(null)

      console.log("🔄 エラー時のCookie削除処理...")
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
      console.log(
        "📊 セッション詳細:",
        session
          ? {
              access_token: session.access_token ? "存在" : "なし",
              refresh_token: session.refresh_token ? "存在" : "なし",
              expires_at: session.expires_at,
              user_id: session.user?.id,
            }
          : "セッションなし",
      )

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
