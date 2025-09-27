"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertCircle, LogIn } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "unauthorized") {
      setError("管理者権限がありません。許可されたアカウントでログインしてください。")
    } else if (errorParam === "auth_failed") {
      setError("認証に失敗しました。再度お試しください。")
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("ログインに失敗しました。再度お試しください。")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">管理者ログイン</h2>
          <p className="mt-2 text-sm text-gray-600">許可されたアカウントのみアクセス可能です</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">認証が必要です</CardTitle>
            <CardDescription className="text-center">
              管理者権限を持つGoogleアカウントでログインしてください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full h-12 text-base" size="lg">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>認証中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="h-5 w-5" />
                  <span>Googleでログイン</span>
                </div>
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>• 管理者として登録されたアカウントのみアクセス可能</p>
              <p>• 不正アクセスは記録され、監視されます</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
