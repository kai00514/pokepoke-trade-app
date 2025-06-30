"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

export function AuthDebug() {
  const { session, isLoading, supabase, refreshSession } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("AuthDebug: Component mounted or session/isLoading changed.")
    console.log("AuthDebug: Current session:", session)
    console.log("AuthDebug: Is loading:", isLoading)
    console.log("AuthDebug: Supabase client available:", !!supabase)

    const checkSession = async () => {
      if (!supabase) {
        setError("Supabase client is not available in AuthDebug.")
        console.error("AuthDebug: Supabase client is undefined.")
        return
      }
      try {
        console.log("AuthDebug: Checking session with supabase.auth...")
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) {
          console.error("AuthDebug: Error getting user:", userError)
          setError(`Error getting user: ${userError.message}`)
          setUser(null)
        } else {
          console.log("AuthDebug: User data:", currentUser)
          setUser(currentUser)
          setError(null)
        }
      } catch (e: any) {
        console.error("AuthDebug: Error checking session", e)
        setError(`Error checking session: ${e.message || e.toString()}`)
        setUser(null)
      }
    }

    if (!isLoading) {
      checkSession()
    }
  }, [session, isLoading, supabase, refreshSession])

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>認証デバッグ情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {isLoading ? (
          <p>セッション情報を読み込み中...</p>
        ) : (
          <>
            <p>
              <strong>セッション状態:</strong> {session ? "アクティブ" : "なし"}
            </p>
            {session && (
              <>
                <p>
                  <strong>ユーザーID:</strong> {session.user?.id}
                </p>
                <p>
                  <strong>メール:</strong> {session.user?.email}
                </p>
                <p>
                  <strong>最終サインイン:</strong>{" "}
                  {session.user?.last_sign_in_at ? new Date(session.user.last_sign_in_at).toLocaleString() : "N/A"}
                </p>
              </>
            )}
            {user && (
              <>
                <p>
                  <strong>現在のユーザーID (getUser):</strong> {user.id}
                </p>
                <p>
                  <strong>現在のユーザーメール (getUser):</strong> {user.email}
                </p>
              </>
            )}
            {error && (
              <p className="text-red-500">
                <strong>エラー:</strong> {error}
              </p>
            )}
            <button onClick={refreshSession} className="text-blue-500 underline">
              セッションを更新
            </button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
