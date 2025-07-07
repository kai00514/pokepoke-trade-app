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

// シンプルなCookie削除関数
function clearAllCookies() {
  console.log("[auth-context] 🍪 Cookie削除開始")
  console.log("[auth-context] 📋 削除前のCookie:", document.cookie)

  const cookies = document.cookie.split(";")

  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()

    if (name) {
      console.log(`[auth-context] 🗑️ Cookie削除: ${name}`)
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
  const router = useRouter()

  // プロファイル読み込み中フラグ
  const isLoadingProfile = useRef(false)
  // 処理済みのユーザーIDを記録
  const processedUserId = useRef<string | null>(null)

  const supabase = createClient()

  const loadUserProfile = useCallback(async (user: User, forceRefresh = false) => {
    // 既に同じユーザーのプロファイルを処理中または処理済みの場合はスキップ
    if (!forceRefresh && (isLoadingProfile.current || processedUserId.current === user.id)) {
      console.log("[auth-context] ⏭️ プロファイル読み込みスキップ:", {
        isLoading: isLoadingProfile.current,
        processedUserId: processedUserId.current,
        currentUserId: user.id,
      })
      return
    }

    try {
      isLoadingProfile.current = true
      console.log("[auth-context] 🔄 プロファイル読み込み開始:", user.id)
      console.log("[auth-context] 📊 ユーザー情報:", {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      })

      let profile = await getUserProfile(user.id, forceRefresh)

      if (!profile) {
        console.log("[auth-context] 📝 新規プロファイル作成:", user.email)
        profile = await createUserProfile(user.id, user.email!)
      }

      console.log("[auth-context] 🎯 プロファイル設定前の状態:", {
        hasProfile: !!profile,
        profileId: profile?.id,
        displayName: profile?.display_name,
        pokepokeId: profile?.pokepoke_id,
        avatarUrl: profile?.avatar_url,
      })

      setUserProfile(profile)
      processedUserId.current = user.id
      console.log("[auth-context] ✅ プロファイル読み込み完了:", profile)
    } catch (error) {
      console.error("[auth-context] ❌ プロファイルの読み込みに失敗しました:", error)

      // エラーが発生した場合でも基本的なプロファイルを設定
      const fallbackProfile: UserProfile = {
        id: user.id,
        display_name: user.email?.split("@")[0] || "ユーザー",
        name: user.email?.split("@")[0] || "ユーザー",
        pokepoke_id: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
      }

      console.log("[auth-context] 🆘 フォールバックプロファイルを設定:", fallbackProfile)
      setUserProfile(fallbackProfile)
      processedUserId.current = user.id
    } finally {
      isLoadingProfile.current = false
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    console.log("[auth-context] 🔄 プロファイル強制更新開始")
    if (user) {
      processedUserId.current = null // 強制更新のためリセット
      await loadUserProfile(user, true)
    }
  }, [user, loadUserProfile])

  const signOut = useCallback(async () => {
    console.log("[auth-context] 🚪 ログアウト処理開始")
    console.log("[auth-context] 📊 ログアウト前の状態:", {
      user: !!user,
      session: !!session,
      userProfile: !!userProfile,
    })

    try {
      // 1. 状態を即座にクリア
      console.log("[auth-context] 🧹 状態即座クリア開始...")
      setUser(null)
      setSession(null)
      setUserProfile(null)
      processedUserId.current = null
      isLoadingProfile.current = false
      console.log("[auth-context] ✅ 状態即座クリア完了")

      // 2. キャッシュとCookie削除を先に実行
      console.log("[auth-context] 🔄 キャッシュ・Cookie削除処理開始...")
      clearUserProfileCache()
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

      // エラーが発生しても状態クリアとキャッシュ削除は実行
      setUser(null)
      setSession(null)
      setUserProfile(null)
      processedUserId.current = null
      isLoadingProfile.current = false
      clearUserProfileCache()
      clearAllCookies()

      toast({
        title: "ログアウトしました",
        description: "ログアウト処理が完了しました。",
      })

      router.push("/")
    }
  }, [supabase, router, user, session, userProfile])

  // プロファイル更新イベントのリスナー
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log("[auth-context] 🔄 プロファイル更新イベント受信:", event.detail)
      setUserProfile(event.detail)
    }

    window.addEventListener("profileUpdated", handleProfileUpdate as EventListener)

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    console.log("[auth-context] 🔄 認証状態監視開始")
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[auth-context] 🔔 認証状態変更:", event, {
        session: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      })

      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        console.log("[auth-context] 👤 ユーザーログイン:", currentUser.email)

        // INITIAL_SESSIONの場合はキャッシュを優先的に使用
        const forceRefresh = event === "SIGNED_IN"
        await loadUserProfile(currentUser, forceRefresh)
      } else {
        console.log("[auth-context] 👋 ユーザーログアウト")
        setUserProfile(null)
        processedUserId.current = null
        isLoadingProfile.current = false
      }

      console.log("[auth-context] 📊 認証状態更新完了:", {
        user: !!currentUser,
        session: !!session,
        userProfile: userProfile ? "loaded" : "null",
      })
    })

    return () => {
      console.log("[auth-context] 🛑 認証状態監視終了")
      subscription.unsubscribe()
    }
  }, [supabase, loadUserProfile])

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
