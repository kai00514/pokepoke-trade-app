"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { AuthProvider } from "@/contexts/auth-context"          // ← 追加

/* ============================================================
   ① ページ本体（AuthProvider 内で使う）
============================================================ */
function ResetPageInner() {
  const [email, setEmail]                     = useState("")
  const [password, setPassword]               = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirmPassword, setShowConfirm] = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [isRecoveryMode, setIsRecoveryMode]   = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const router   = useRouter()
  const { toast} = useToast()
  const supabase = createClient()

  /* ── URL hash を解析してリカバリーモード判定 ── */
  useEffect(() => {
    if (typeof window === "undefined") return
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const aTok = hash.get("access_token")
    const rTok = hash.get("refresh_token")
    const type = hash.get("type")
    if (aTok && rTok && type === "recovery") {
      setIsRecoveryMode(true)
      supabase.auth.setSession({ access_token: aTok, refresh_token: rTok })
    }
  }, [supabase.auth])

  /* ── パスワードリセットメール送信 ── */
  const handleMail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return setMsg({ type: "error", text: "メールアドレスを入力してください。" })
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/reset` })
    if (error) {
      setMsg({ type: "error", text: error.message })
      toast({ title: "エラー", description: error.message, variant: "destructive" })
    } else {
      setMsg({ type: "success", text: "リセットリンクを送信しました。メールをご確認ください。" })
      toast({ title: "メール送信完了", description: "パスワードリセット用メールを送信しました。" })
    }
    setLoading(false)
  }

  /* ── パスワード更新 ── */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword)  return setMsg({ type: "error", text: "すべての項目を入力してください。" })
    if (password.length < 6)            return setMsg({ type: "error", text: "パスワードは6文字以上です。" })
    if (password !== confirmPassword)   return setMsg({ type: "error", text: "パスワードが一致しません。" })

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMsg({ type: "error", text: error.message })
      toast({ title: "エラー", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "パスワード更新完了", description: "正常に更新されました。" })
      router.push("/auth/login?reset=success")
    }
    setLoading(false)
  }

  /* ── カード共通ラッパー ── */
  const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-full max-w-lg sm:max-w-xl lg:max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-10 sm:p-12 shadow-2xl">{children}</div>
    </div>
  )

  /* ── 共通アラート ── */
  const Msg = msg && (
    <Alert variant={msg.type === "error" ? "destructive" : "default"} className={`mb-8 ${msg.type === "success" && "border-green-200 bg-green-50"}`}>
      {msg.type === "success" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
      <AlertDescription className={msg.type === "success" ? "text-green-800" : ""}>{msg.text}</AlertDescription>
    </Alert>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {isRecoveryMode ? (
        /* ───── 新しいパスワード入力 ───── */
        <Card>
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">新しいパスワード</h1>
            <p className="text-purple-500">新しいパスワードを設定してください</p>
          </div>

          {Msg}

          <form onSubmit={handleUpdate} className="space-y-6">
            {/* password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">新しいパスワード</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="6文字以上"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {/* confirm */}
            <div className="space-y-2">
              <label htmlFor="confirm" className="text-sm font-medium text-gray-700">パスワード確認</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="もう一度入力"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl" disabled={loading}>
              {loading ? "更新中..." : "パスワードを更新"}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">ログインページに戻る</Link>
          </div>
        </Card>
      ) : (
        /* ───── メール入力 ───── */
        <Card>
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">パスワードリセット</h1>
            <p className="text-purple-500">メールアドレスを入力してください</p>
          </div>

          {Msg}

          <form onSubmit={handleMail} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">メールアドレス</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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

            <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl" disabled={loading}>
              {loading ? "送信中..." : "リセットメールを送信"}
            </Button>
          </form>

          <div className="mt-10 text-center space-y-4">
            <Link href="/auth/login"  className="text-purple-600 hover:text-purple-700 font-medium block">ログインページに戻る</Link>
            <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-medium block">新規会員登録</Link>
          </div>
        </Card>
      )}
    </div>
  )
}

/* ============================================================
   ② デフォルトエクスポート
      AuthProvider でラップしてコンテキストを有効にする
============================================================ */
export default function ResetPage() {
  return (
    <AuthProvider>
      <ResetPageInner />
    </AuthProvider>
  )
}
