"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ConfirmPage() {
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")
        const next = searchParams.get("next") ?? "/"

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          })

          if (error) {
            console.error("Email confirmation error:", error)
            setError(error.message || "メール確認に失敗しました。")
          } else {
            setConfirmed(true)
            // 確認成功後、少し待ってからリダイレクト
            setTimeout(() => {
              router.push(next)
            }, 2000)
          }
        } else {
          setError("確認に必要な情報が不足しています。")
        }
      } catch (err) {
        console.error("Unexpected confirmation error:", err)
        setError("予期しないエラーが発生しました。")
      } finally {
        setLoading(false)
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">メール確認中...</CardTitle>
            <CardDescription>アカウントの確認を行っています。しばらくお待ちください。</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">確認完了</CardTitle>
            <CardDescription>メールアドレスの確認が完了しました。アカウントが有効になりました。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  自動的にホームページにリダイレクトされます...
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => router.push("/")}>
                今すぐホームに移動
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">確認エラー</CardTitle>
          <CardDescription>メールアドレスの確認に失敗しました。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/auth/login")}>
                ログインページに戻る
              </Button>
              <div className="text-center">
                <Link href="/auth/signup" className="text-sm text-blue-600 hover:underline">
                  新規登録をやり直す
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
