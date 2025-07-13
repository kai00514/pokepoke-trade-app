"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleIcon } from "@/components/icons/google-icon"
import { XIcon } from "@/components/icons/twitter-icon"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowRight, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading("email")
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      // パスワード確認
      if (password !== confirmPassword) {
        setErrorMessage("パスワードが一致しません。")
        return
      }

      // パスワード強度チェック
      if (password.length < 6) {
        setErrorMessage("パスワードは6文字以上で入力してください。")
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
        },
      })

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "登録済みアカウント",
            description: "このメールアドレスは既に登録されています。ログインページからログインしてください。",
            variant: "destructive",
          })
          return
        } else if (error.message.includes("Invalid email")) {
          setErrorMessage("有効なメールアドレスを入力してください。")
        } else {
          setErrorMessage(error.message || "登録に失敗しました。")
        }
        toast({
          title: "登録エラー",
          description: error.message,
          variant: "destructive",
        })
      } else if (data.user && !data.session) {
        // メール確認が必要な場合
        setSuccessMessage("確認メールを送信しました。メールをご確認の上、リンクをクリックして登録を完了してください。")
        toast({
          title: "確認メール送信",
          description: "メールをご確認ください。",
        })
      } else if (data.session) {
        // 即座にログインできた場合
        toast({
          title: "登録完了",
          description: "アカウントが作成されました。",
        })
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Signup error:", error)
      const errorMsg = "アカウント作成に失敗しました。"
      setErrorMessage(errorMsg)
      toast({
        title: "エラー",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleSocialSignup = async (provider: "google" | "twitter") => {
    setLoading(provider)

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
        toast({
          title: "登録エラー",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      // Code Flow 用の URL を受け取ってリダイレクト
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Social signup error:", error)
      toast({
        title: "エラー",
        description: "ソーシャル登録に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-violet-500 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">メールアドレスで登録</h1>
            <p className="text-violet-100">アカウント情報を入力してください</p>
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

            <form onSubmit={handleEmailSignup} className="space-y-6">
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
                    className="pl-10 h-12 border-gray-200 focus:border-violet-500 focus:ring-violet-500 bg-white/80 backdrop-blur-sm"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-violet-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="6文字以上のパスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-violet-500 focus:ring-violet-500 bg-white/80 backdrop-blur-sm"
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
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-violet-500 focus:ring-violet-500 bg-white/80 backdrop-blur-sm"
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
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading === "email"}
              >
                {loading === "email" ? "登録中..." : "アカウントを作成"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowEmailForm(false)}
                className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 transition-colors"
              >
                ← 他の登録方法を選択
              </Button>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
              会員登録は利用規約およびプライバシーポリシーに同意したとみなします。
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-2">すでにアカウントをお持ちの方</p>
              <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-violet-500 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">会員登録</h1>
          <p className="text-violet-100">アカウントを作成してポケモンカードの取引を始めましょう</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="space-y-4">
            <Button
              onClick={() => setShowEmailForm(true)}
              className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl flex items-center justify-between px-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3" />
                <span>メールアドレスで新規登録</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              onClick={() => handleSocialSignup("google")}
              variant="outline"
              className="w-full h-14 border-gray-200 hover:bg-violet-50 hover:border-violet-300 rounded-xl flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm transition-all duration-200"
              disabled={loading === "google"}
            >
              <div className="flex items-center">
                <GoogleIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">{loading === "google" ? "登録中..." : "Googleで登録"}</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 border-gray-200 rounded-xl flex items-center justify-between px-6 opacity-50 cursor-not-allowed bg-white/60 backdrop-blur-sm"
              disabled
            >
              <div className="flex items-center">
                <div className="w-5 h-5 mr-3 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">L</span>
                </div>
                <span className="font-medium text-gray-400">LINEで登録（準備中）</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Button>

            <Button
              onClick={() => handleSocialSignup("twitter")}
              variant="outline"
              className="w-full h-14 border-gray-200 hover:bg-violet-50 hover:border-violet-300 rounded-xl flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm transition-all duration-200"
              disabled={loading === "twitter"}
            >
              <div className="flex items-center">
                <XIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">{loading === "twitter" ? "登録中..." : "Xで登録"}</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            ※ソーシャルログイン機能は現在ブラウザのみで提供しています。
          </div>

          <div className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
            会員登録は利用規約およびプライバシーポリシーに同意したとみなします。
            <br />
            ご確認の上、会員登録を進めてください。
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">すでにアカウントをお持ちの方</p>
            <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
