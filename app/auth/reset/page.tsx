"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import React from "react" // Renamed import to avoid redeclaration

export default function ResetPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"request" | "update">("request")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  React.useEffect(() => {
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")

    if (token_hash && type === "recovery") {
      setStep("update")
    }
  }, [searchParams])

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })

      if (error) {
        setErrorMessage(error.message || "パスワードリセットメールの送信に失敗しました。")
        toast({
          title: "エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setSuccessMessage("パスワードリセットメールを送信しました。メールをご確認ください。")
        toast({
          title: "メール送信完了",
          description: "パスワードリセットメールを送信しました。",
        })
      }
    } catch (error) {
      console.error("Reset request error:", error)
      const errorMsg = "パスワードリセットの要求に失敗しました。"
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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      if (password !== confirmPassword) {
        setErrorMessage("パスワードが一致しません。")
        return
      }

      if (password.length < 6) {
        setErrorMessage("パスワードは6文字以上で入力してください。")
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setErrorMessage(error.message || "パスワードの更新に失敗しました。")
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
      const errorMsg = "パスワードの更新に失敗しました。"
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

  if (step === "update") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">新しいパスワード</h1>
            <p className="text-purple-100">新しいパスワードを設定してください</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            {errorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
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
                ← ログインページに戻る
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
          <p className="text-purple-100">登録済みのメールアドレスを入力してください</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
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

          <form onSubmit={handleResetRequest} className="space-y-6">
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

            <Button
              type="submit"
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl"
              disabled={loading}
            >
              {loading ? "送信中..." : "リセットメールを送信"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">パスワードを思い出した方</p>
            <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">
              ログインページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
