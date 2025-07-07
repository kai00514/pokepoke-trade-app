"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
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

function clearAllCookies() {
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  const supabase = useMemo(() => createClient(), [])

  const loadUserProfile = useCallback(async (user: User) => {
    try {
      let profile = await getUserProfile(user.id)

      if (!profile) {
        profile = await createUserProfile(user.id, user.email!)
      }

      setUserProfile(profile)
    } catch (error) {
      console.error("[auth-context] プロファイル読み込み失敗:", error)

      const fallbackProfile: UserProfile = {
        id: user.id,
        display_name: user.email?.split("@")[0] || "ユーザー",
        name: user.email?.split("@")[0] || "ユーザー",
        pokepoke_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setUserProfile(fallbackProfile)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user)
    }
  }, [user, loadUserProfile])

  const signOut = useCallback(async () => {
    try {
      setUser(null)
      setSession(null)
      setUserProfile(null)
      clearAllCookies()

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("[auth-context] ログアウトエラー:", error)
      }

      clearAllCookies()

      toast({
        title: "ログアウトしました",
        description: "正常にログアウトが完了しました。",
      })

      router.push("/")
    } catch (error) {
      console.error("[auth-context] ログアウト処理エラー:", error)

      setUser(null)
      setSession(null)
      setUserProfile(null)
      clearAllCookies()

      toast({
        title: "ログアウトしました",
        description: "ログアウト処理が完了しました。",
      })

      router.push("/")
    }
  }, [supabase, router])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser && !isInitialized) {
        await loadUserProfile(currentUser)
        setIsInitialized(true)
      } else if (!currentUser) {
        setUserProfile(null)
        setIsInitialized(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, loadUserProfile, isInitialized])

  const contextValue = useMemo(
    () => ({
      user,
      session,
      userProfile,
      signOut,
      refreshProfile,
    }),
    [user, session, userProfile, signOut, refreshProfile],
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
