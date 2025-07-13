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
import { AlertCircle, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  // URLパラメータからトークンとタイプを取得
  const accessToken = searchParams.get("access_token")
  const refreshToken = searchParams.get("refresh_token")
  const type = searchParams.get("type")

  // クライアントサイドでのみ実行されるようにuseEffectを使用
  useEffect(() => {
    const handleAuthSession = async () => {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setMessage({ type: "error", text: `セッション設定エラー: ${error.message}` })
          toast({
            title: "エラー",
            description: `セッション設定エラー: ${error.message}`,
            variant: "destructive",
          })
        } else {
          // セッションが設定されたらURLからトークンを削除
          router.replace("/auth/reset", undefined) // クリーンなURLにリダイレクト
        }
      }
    }
    handleAuthSession()
  }, [accessToken, refreshToken, router, supabase.auth, toast])

  const handleResetPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (!email) {
        setMessage({ type: "error", text: "メールアドレスを入力してください。" })
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })

      if (error) {
        setMessage({ type: "error", text: error.message || "パスワードリセットメールの送信に失敗しました。" })
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setMessage({
          type: "success",
          text: "パスワードリセットのリンクをメールアドレスに送信しました。メールをご確認ください。",
        })
        toast({
          title: "メール送信完了",
          description: "パスワードリセットのリンクを送信しました。",
        })
      }
    } catch (error) {
      console.error("Reset password request error:", error)
      setMessage({ type: "error", text: "予期しないエラーが発生しました。" })
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (password !== confirmPassword) {
        setMessage({ type: "error", text: "パスワードが一致しません。" })
        return
      }
      if (password.length < 6) {
        setMessage({ type: "error", text: "パスワードは6文字以上で入力してください。" })
        return
      }

      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setMessage({ type: "error", text: error.message || "パスワードの更新に失敗しました。" })
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setMessage({ type: "success", text: "パスワードが正常に更新されました。ログインページへ移動してください。" })
        toast({
          title: "パスワード更新完了",
          description: "新しいパスワードでログインしてください。",
        })
        // ログインページへリダイレクト
        router.push("/auth/login?reset=success")
      }
    } catch (error) {
      console.error("Update password error:", error)
      setMessage({ type: "error", text: "予期しないエラーが発生しました。" })
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // access_tokenが存在する場合、新しいパスワードを設定するフォームを表示
  if (accessToken && refreshToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">新しいパスワードを設定</h1>
            <p className="text-white/90">新しいパスワードを入力してください</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
            {message && (
              <Alert
                variant={message.type === "error" ? "destructive" : "default"}
                className={`mb-6 ${message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
              >
                {message.type === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  新しいパスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-violet-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="6文字以上の新しいパスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500 bg-white/80 backdrop-blur-sm"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-violet-600 transition-colors"
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-violet-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="パスワードを再入力"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-violet-500 bg-white/80 backdrop-blur-sm"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-violet-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? "更新中..." : "パスワードを更新"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-2">ログインページに戻る</p>
              <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // access_tokenが存在しない場合、パスワードリセットメール送信フォームを表示
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">パスワードをリセット</h1>
          <p className="text-white/90">メールアドレスを入力してください</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
          {message && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
              className={`mb-6 ${message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
            >
              {message.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleResetPasswordRequest} className="space-y-6">
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
              {loading ? "送信中..." : "パスワードリセットメールを送信"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">ログインページに戻る</p>
            <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
