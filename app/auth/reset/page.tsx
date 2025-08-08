"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      setErrorMessage("パスワードリセットリンクが無効または期限切れです。再度リクエストしてください。")
    }
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      if (!email) {
        setErrorMessage("メールアドレスを入力してください。")
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset?reset=true`,
      })

      if (error) {
        setErrorMessage(error.message || "パスワードリセットメールの送信に失敗しました。")
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setSuccessMessage("パスワードリセットのリンクをメールアドレスに送信しました。ご確認ください。")
        toast({
          title: "メール送信完了",
          description: "パスワードリセットのリンクを送信しました。",
        })
      }
    } catch (error) {
      console.error("Reset password error:", error)
      setErrorMessage("予期しないエラーが発生しました。")
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2 drop-shadow-lg">パスワードをリセット</h1>
          <p className="text-slate-700">登録済みのメールアドレスを入力してください</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
          {errorMessage && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-violet-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="あなたのメールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500 bg-white/80 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-200"
              disabled={loading}
            >
              {loading ? "送信中..." : "リセットリンクを送信"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">ログイン画面に戻る</p>
            <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
