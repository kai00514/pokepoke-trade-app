"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GoogleIcon } from "@/components/icons/google-icon"
import { TwitterIcon } from "@/components/icons/twitter-icon"
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!email || !password || !confirmPassword) {
      setMessage({ type: "error", text: "すべてのフィールドを入力してください。" })
      setLoading(false)
      return
    }

    if (!validatePassword(password)) {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (error) {
        if (error.message.includes("User already registered")) {
          setMessage({ type: "error", text: "このメールアドレスは既に登録されています。ログインしてください。" })
        } else {
          setMessage({ type: "error", text: error.message || "アカウント作成に失敗しました。" })
        }
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      } else if (data.user && !data.session) {
        setMessage({
          type: "success",
          text: "確認メールを送信しました。メールボックスをご確認ください。",
        })
        toast({
          title: "確認メール送信",
          description: "メールアドレスの確認が必要です。",
        })
      } else if (data.session) {
        toast({
          title: "アカウント作成完了",
          description: "アカウントが正常に作成されました。",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Sign up error:", error)
      setMessage({ type: "error", text: "予期しないエラーが発生しました。" })
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: "google" | "twitter") => {
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
      console.error("Social sign up error:", error)
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
          <h1 className="text-3xl font-bold text-black mb-2">アカウント作成</h1>
          <p className="text-purple-100">新しいアカウントを作成してください</p>
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

          <form onSubmit={handleEmailSignUp} className="space-y-6">
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
                  placeholder="6文字以上のパスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="text-xs">
                  <span className={validatePassword(password) ? "text-green-600" : "text-red-600"}>
                    {validatePassword(password) ? "✓ パスワードの強度: 良好" : "✗ 6文字以上必要"}
                  </span>
                </div>
              )}
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
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && (
                <div className="text-xs">
                  <span className={password === confirmPassword ? "text-green-600" : "text-red-600"}>
                    {password === confirmPassword ? "✓ パスワードが一致" : "✗ パスワードが一致しません"}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl"
              disabled={loading}
            >
              {loading ? "作成中..." : "アカウントを作成"}
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
                onClick={() => handleSocialSignUp("google")}
                disabled={socialLoading === "google"}
              >
                <GoogleIcon className="w-5 h-5 mr-3" />
                {socialLoading === "google" ? "接続中..." : "Googleで続行"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
                onClick={() => handleSocialSignUp("twitter")}
                disabled={socialLoading === "twitter"}
              >
                <TwitterIcon className="w-5 h-5 mr-3" />
                {socialLoading === "twitter" ? "接続中..." : "Xで続行"}
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
                LINEで続行（準備中）
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">既にアカウントをお持ちですか？</p>
            <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">
              ログインはこちら
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
