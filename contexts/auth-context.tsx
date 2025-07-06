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
      // Supabaseからログアウト
      console.log("🔄 Supabaseログアウト実行中...")
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("❌ ログアウトエラー:", error)
        toast({
          title: "ログアウトに失敗しました",
          description: "再度お試しください。",
          variant: "destructive",
        })
        return
      }

      console.log("✅ Supabaseログアウト成功")

      // セッション削除の確認
      console.log("🔍 セッション削除確認中...")
      const {
        data: { session: remainingSession },
      } = await supabase.auth.getSession()

      if (remainingSession) {
        console.error("⚠️ セッションが残っています:", remainingSession)
        toast({
          title: "ログアウトに失敗しました",
          description: "セッションの削除に失敗しました。",
          variant: "destructive",
        })
        return
      }

      console.log("✅ セッション削除確認完了")

      // 状態をクリア
      console.log("🧹 状態クリア中...")
      setUser(null)
      setSession(null)
      setUserProfile(null)
      console.log("✅ 状態クリア完了")

      // 成功メッセージを表示
      toast({
        title: "ログアウトしました",
        description: "正常にログアウトが完了しました。",
      })

      // ホームページにリダイレクト
      console.log("🏠 ホームページにリダイレクト中...")
      router.push("/")
      console.log("✅ ログアウト処理完了")
    } catch (error) {
      console.error("❌ ログアウト処理中にエラーが発生しました:", error)
      toast({
        title: "ログアウトに失敗しました",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
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
