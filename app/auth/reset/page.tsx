"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, AlertCircle, Eye, EyeOff, Lock } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function ResetPage() {
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isResetMode, setIsResetMode] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // URLにaccess_tokenがある場合は、パスワード更新モードに切り替え
    const accessToken = searchParams.get("access_token")
    if (accessToken) {
      setIsResetMode(true)
    }
  }, [searchParams])

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleResetRequest = async (e: React.FormEvent) => {
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
      } else {
        setMessage({
          type: "success",
          text: "パスワードリセット用のメールを送信しました。メールボックスをご確認ください。",
        })
        setEmail("")
      }
    } catch (err) {
      console.error("Reset password error:", err)
      setMessage({ type: "error", text: "予期しないエラーが発生しました。" })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "すべてのフィールドを入力してください。" })
      setLoading(false)
      return
    }

    if (!validatePassword(newPassword)) {
      setMessage({ type: "error", text: "パスワードは6文字以上である必要があります。" })
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "パスワードが一致しません。" })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setMessage({ type: "error", text: error.message || "パスワードの更新に失敗しました。" })
      } else {
        setMessage({
          type: "success",
          text: "パスワードが正常に更新されました。ログインページに移動してください。",
        })
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err) {
      console.error("Update password error:", err)
      setMessage({ type: "error", text: "予期しないエラーが発生しました。" })
    } finally {
      setLoading(false)
    }
  }

  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">新しいパスワード設定</CardTitle>
            <CardDescription>新しいパスワードを入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">新しいパスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="6文字以上"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="text-sm">
                    <span className={validatePassword(newPassword) ? "text-green-600" : "text-red-600"}>
                      {validatePassword(newPassword) ? "✓ パスワードの強度: 良好" : "✗ 6文字以上必要"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード確認</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="パスワードを再入力"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="text-sm">
                    <span className={newPassword === confirmPassword ? "text-green-600" : "text-red-600"}>
                      {newPassword === confirmPassword ? "✓ パスワードが一致" : "✗ パスワードが一致しません"}
                    </span>
                  </div>
                )}
              </div>

              {message && (
                <Alert
                  variant={message.type === "error" ? "destructive" : "default"}
                  className={message.type === "success" ? "border-green-200 bg-green-50" : ""}
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "更新中..." : "パスワードを更新"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-sm text-blue-600 hover:underline">
                ログインページに戻る
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">パスワードリセット</CardTitle>
          <CardDescription>メールアドレスを入力してパスワードリセット用のリンクを受け取る</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {message && (
              <Alert
                variant={message.type === "error" ? "destructive" : "default"}
                className={message.type === "success" ? "border-green-200 bg-green-50" : ""}
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "送信中..." : "リセットメールを送信"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              パスワードを思い出しましたか？{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                ログイン
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
