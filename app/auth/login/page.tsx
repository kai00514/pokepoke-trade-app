"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleIcon } from "@/components/icons/google-icon"
import { XIcon } from "@/components/icons/twitter-icon"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  // URLパラメータからエラーメッセージを取得
  useEffect(() => {
    const error = searchParams.get("error")
    const message = searchParams.get("message")
    const reset = searchParams.get("reset")

    if (error) {
      let errorText = "認証エラーが発生しました。"

      switch (error) {
        case "callback_error":
          errorText = message || "認証プロセスでエラーが発生しました。"
          break
        case "no_code":
          errorText = "認証コードが見つかりませんでした。"
          break
        case "no_session":
          errorText = "セッションの作成に失敗しました。"
          break
        default:
          errorText = message || "予期しないエラーが発生しました。"
      }

      setErrorMessage(errorText)
    }

    if (reset === "success") {
      toast({
        title: "パスワード更新完了",
        description: "新しいパスワードでログインしてください。",
      })
    }
  }, [searchParams, toast])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      if (!email || !password) {
        setErrorMessage("メールアドレスとパスワードを入力してください。")
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("メールアドレスまたはパスワードが正しくありません。")
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage("メールアドレスが確認されていません。確認メールをご確認ください。")
        } else if (error.message.includes("Too many requests")) {
          setErrorMessage("ログイン試行回数が上限に達しました。しばらく時間をおいてから再試行してください。")
        } else {
          setErrorMessage(error.message || "ログインに失敗しました。")
        }
        toast({
          title: "ログインエラー",
          description: error.message,
          variant: "destructive",
        })
      } else if (data.user) {
        toast({
          title: "ログイン成功",
          description: "ログインしました。",
        })

        // リダイレクト先を取得（クリーンなURL）
        const redirect = searchParams.get("redirect") || "/"
        const cleanUrl = redirect.startsWith("/") ? redirect : "/"
        router.push(cleanUrl)
        router.refresh()
      }
    } catch (error) {
      console.error("Login error:", error)
      const errorMsg = "ログインに失敗しました。"
      setErrorMessage(errorMsg)
      toast({
        title: "エラー",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "twitter") => {
    setErrorMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "consent",
          },
        },
      })

      if (error) {
        setErrorMessage(error.message)
        toast({
          title: "ログインエラー",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      // Code Flow 用の URL を受け取って自前でリダイレクト
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Social login error:", error)
      const errorMsg = "ソーシャルログインに失敗しました。"
      setErrorMessage(errorMsg)
      toast({
        title: "エラー",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setErrorMessage("メールアドレスを入力してください。")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (error) {
        setErrorMessage(error.message || "確認メールの再送信に失敗しました。")
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "確認メール再送信",
          description: "確認メールを再送信しました。",
        })
        setErrorMessage(null)
      }
    } catch (error) {
      console.error("Resend confirmation error:", error)
      setErrorMessage("予期しないエラーが発生しました。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">ログイン</h1>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
                {errorMessage.includes("確認されていません") && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                      disabled={loading}
                    >
                      確認メールを再送信
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <Link href="/auth/reset" className="text-sm text-purple-600 hover:text-purple-700">
                  パスワードを忘れた方はこちら
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="あなたのパスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  required
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

            <Button
              type="submit"
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl"
              disabled={loading}
            >
              {loading ? "ログイン中..." : "ログインする"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">または</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl bg-transparent"
                onClick={() => handleSocialLogin("google")}
              >
                <GoogleIcon className="mr-3 h-5 w-5" />
                <span className="font-medium">Googleでログイン</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl opacity-50 cursor-not-allowed bg-transparent"
                disabled
              >
                <div className="w-5 h-5 mr-3 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">L</span>
                </div>
                <span className="font-medium text-gray-400">LINEでログイン（準備中）</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl bg-transparent"
                onClick={() => handleSocialLogin("twitter")}
              >
                <XIcon className="mr-3 h-5 w-5" />
                <span className="font-medium">Xでログイン</span>
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            ※ソーシャルログイン機能は現在ブラウザのみで提供しています。
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">アカウントをお持ちでない方</p>
            <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-medium">
              新規会員登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
