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
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

export default function ResetPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // URLハッシュからパラメータを取得（クライアントサイドでのみ実行）
    if (typeof window !== "undefined") {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      const type = hashParams.get("type")

      if (accessToken && refreshToken && type === "recovery") {
        setIsRecoveryMode(true)
        // セッションを設定
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
      }
    }
  }, [supabase.auth])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!email) {
      setMessage({ type: "error", text: "メールアドレスを入力してください。" })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })

      if (error) {
        setMessage({ type: "error", text: error.message || "パスワードリセットに失敗しました。" })
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setMessage({
          type: "success",
          text: "パスワードリセット用のメールを送信しました。メールをご確認ください。",
        })
        toast({
          title: "メール送信完了",
          description: "パスワードリセット用のメールを送信しました。",
        })
      }
    } catch (error) {
      console.error("Password reset error:", error)
      setMessage({ type: "error", text: "予期しないエラーが発生しました。" })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!password || !confirmPassword) {
      setMessage({ type: "error", text: "すべてのフィールドを入力してください。" })
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "パスワードは6文字以上である必要があります。" })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "パスワードが一致しません。" })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setMessage({ type: "error", text: error.message || "パスワードの更新に失敗しました。" })
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "パスワード更新完了",
          description: "パスワードが正常に更新されました。",
        })
        router.push("/auth/login?reset=success")
      }
    } catch (error) {
      console.error("Password update error:", error)
      setMessage({ type: "error", text: "予期しないエラーが発生しました。" })
    } finally {
      setLoading(false)
    }
  }

  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">新しいパスワード</h1>
            <p className="text-purple-100">新しいパスワードを設定してください</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            {message && (
              <Alert
                variant={message.type === "error" ? "destructive" : "default"}
                className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : ""}`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  新しいパスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="6文字以上のパスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  パスワード確認
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="パスワードを再入力"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl"
                disabled={loading}
              >
                {loading ? "更新中..." : "パスワードを更新"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">
                ログインページに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">パスワードリセット</h1>
          <p className="text-purple-100">メールアドレスを入力してください</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {message && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
              className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : ""}`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="あなたのメールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl"
              disabled={loading}
            >
              {loading ? "送信中..." : "リセットメールを送信"}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium block">
              ログインページに戻る
            </Link>
            <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-medium block">
              新規会員登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
