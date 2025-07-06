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
      let profile = await getUserProfile(user.id)
      if (!profile) {
        profile = await createUserProfile(user.id, user.email!)
      }
      setUserProfile(profile)
    } catch (error) {
      console.error("プロファイルの読み込みに失敗しました:", error)
      setUserProfile(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user)
    }
  }, [user, loadUserProfile])

  const signOut = useCallback(async () => {
    try {
      // Supabaseからログアウト
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("ログアウトエラー:", error)
        toast({
          title: "ログアウトに失敗しました",
          description: "再度お試しください。",
          variant: "destructive",
        })
        return
      }

      // セッション削除の確認
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        console.error("セッションが残っています")
        toast({
          title: "ログアウトに失敗しました",
          description: "セッションの削除に失敗しました。",
          variant: "destructive",
        })
        return
      }

      // 状態をクリア
      setUser(null)
      setSession(null)
      setUserProfile(null)

      // 成功メッセージを表示
      toast({
        title: "ログアウトしました",
        description: "正常にログアウトが完了しました。",
      })

      // ホームページにリダイレクト
      router.push("/")
    } catch (error) {
      console.error("ログアウト処理中にエラーが発生しました:", error)
      toast({
        title: "ログアウトに失敗しました",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    }
  }, [supabase, router])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await loadUserProfile(currentUser)
      } else {
        setUserProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, loadUserProfile])

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
