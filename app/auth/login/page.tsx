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
import { GoogleIcon } from "@/components/icons/google-icon"
import { TwitterIcon } from "@/components/icons/twitter-icon"
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showResendButton, setShowResendButton] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const reset = searchParams.get("reset")
    if (reset === "success") {
      setMessage({
        type: "success",
        text: "パスワードが正常に更新されました。新しいパスワードでログインしてください。",
      })
    }
  }, [searchParams])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setShowResendButton(false)

    if (!email || !password) {
      setMessage({ type: "error", text: "メールアドレスとパスワードを入力してください。" })
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setMessage({
            type: "error",
            text: "メールアドレスが確認されていません。確認メールをご確認ください。",
          })
          setShowResendButton(true)
        } else if (error.message.includes("Invalid login credentials")) {
          setMessage({ type: "error", text: "メールアドレスまたはパスワードが正しくありません。" })
        } else {
          setMessage({ type: "error", text: error.message || "ログインに失敗しました。" })
        }
        toast({
          title: "ログインエラー",
          description: error.message,
          variant: "destructive",
        })
      } else if (data.session) {
        toast({
          title: "ログイン成功",
          description: "正常にログインしました。",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Login error:", error)
      setMessage({ type: "error", text: "予期しないエラーが発生しました。" })
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResendLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (error) {
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
        setShowResendButton(false)
      }
    } catch (error) {
      console.error("Resend error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setResendLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "twitter") => {
    setSocialLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Social login error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setSocialLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">ログイン</h1>
          <p className="text-purple-100">アカウントにログインしてください</p>
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

          {showResendButton && (
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
              >
                {resendLoading ? "送信中..." : "確認メールを再送信"}
              </Button>
            </div>
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
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="パスワード"
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

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/auth/reset" className="text-purple-600 hover:text-purple-700">
                  パスワードを忘れた方
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl"
              disabled={loading}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
                onClick={() => handleSocialLogin("google")}
                disabled={socialLoading === "google"}
              >
                <GoogleIcon className="w-5 h-5 mr-3" />
                {socialLoading === "google" ? "接続中..." : "Googleでログイン"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
                onClick={() => handleSocialLogin("twitter")}
                disabled={socialLoading === "twitter"}
              >
                <TwitterIcon className="w-5 h-5 mr-3" />
                {socialLoading === "twitter" ? "接続中..." : "Xでログイン"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-gray-50 opacity-50 cursor-not-allowed bg-transparent"
                disabled
              >
                <div className="w-5 h-5 mr-3 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">L</span>
                </div>
                LINEでログイン（準備中）
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">アカウントをお持ちでない方</p>
            <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-medium">
              新規登録はこちら
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
