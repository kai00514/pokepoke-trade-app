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
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
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
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-10 sm:py-14 lg:py-16">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl font-bold text-slate-800 mb-2 drop-shadow-sm">ログイン</h1>
            <p className="text-slate-700">アカウントにログインしてください</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
            {errorMessage && (
              <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50" aria-live="polite">
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
                        className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                      >
                        確認メールを再送信
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-6" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="あなたのメールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                    required
                    autoComplete="email"
                    aria-invalid={!!errorMessage || undefined}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    パスワード
                  </label>
                  <Link href="/auth/reset" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    パスワードを忘れた方はこちら
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" aria-hidden="true" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="あなたのパスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                    required
                    autoComplete="current-password"
                    aria-invalid={!!errorMessage || undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-2xl transition-all duration-200"
                disabled={loading}
                aria-busy={loading}
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
                  <span className="px-4 bg-white/95 text-gray-500">または</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-blue-200 hover:bg-blue-50 hover:border-blue-400 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-200"
                  onClick={() => handleSocialLogin("google")}
                >
                  <GoogleIcon className="mr-3 h-5 w-5" />
                  <span className="font-medium">Googleでログイン</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-blue-200 rounded-xl opacity-50 cursor-not-allowed bg-white/60 backdrop-blur-sm"
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
                  className="w-full h-12 border-blue-200 hover:bg-blue-50 hover:border-blue-400 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-200"
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

            <div className="mt-10 text-center">
              <p className="text-gray-600 mb-2">アカウントをお持ちでない方</p>
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                新規会員登録
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
