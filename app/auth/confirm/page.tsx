"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ConfirmPage() {
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (!token_hash || type !== "email") {
          setError("無効な確認リンクです。")
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "email",
        })

        if (error) {
          console.error("Email confirmation error:", error)
          if (error.message.includes("expired")) {
            setError("確認リンクの有効期限が切れています。新しい確認メールを送信してください。")
          } else if (error.message.includes("invalid")) {
            setError("無効な確認リンクです。")
          } else {
            setError("メール確認に失敗しました。")
          }
        } else if (data.user) {
          setConfirmed(true)
          toast({
            title: "メール確認完了",
            description: "アカウントが有効化されました。",
          })

          // 2秒後にホームページにリダイレクト
          setTimeout(() => {
            router.push("/")
            router.refresh()
          }, 2000)
        }
      } catch (error) {
        console.error("Confirmation error:", error)
        setError("メール確認中にエラーが発生しました。")
      } finally {
        setLoading(false)
      }
    }

    confirmEmail()
  }, [searchParams, router, toast, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md w-full">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">メール確認中...</h1>
          <p className="text-gray-600">しばらくお待ちください</p>
        </div>
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md w-full">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">確認完了！</h1>
          <p className="text-gray-600 mb-6">
            メールアドレスの確認が完了しました。
            <br />
            まもなくホームページに移動します。
          </p>
          <Button onClick={() => router.push("/")} className="w-full bg-purple-600 hover:bg-purple-700">
            ホームページへ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md w-full">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">確認エラー</h1>

        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Link href="/auth/login">
            <Button variant="outline" className="w-full bg-transparent">
              ログインページへ
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">新規登録へ</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
