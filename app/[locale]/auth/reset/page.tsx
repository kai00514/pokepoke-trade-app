"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ResetPasswordPage() {
  const t = useTranslations()
  const params = useParams()
  const locale = params.locale as string
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast} = useToast()
  const supabase = createClient()

  // URLパラメータからトークンとタイプを取得
  const accessToken = searchParams.get("access_token")
  const refreshToken = searchParams.get("refresh_token")

  // クライアントサイドでのみ実行されるようにuseEffectを使用
  useEffect(() => {
    const handleAuthSession = async () => {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setMessage({ type: "error", text: `${t('errors.auth.sessionSetupError')}: ${error.message}` })
          toast({
            title: t('errors.generic.error'),
            description: `${t('errors.auth.sessionSetupError')}: ${error.message}`,
            variant: "destructive",
          })
        } else {
          // セッションが設定されたらURLからトークンを削除
          router.replace(`/${locale}/auth/reset`)
        }
      }
    }
    handleAuthSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, refreshToken])

  const handleResetPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (!email) {
        setMessage({ type: "error", text: t('errors.validation.emailRequired') })
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/auth/reset`,
      })

      if (error) {
        setMessage({ type: "error", text: error.message || t('errors.auth.resetEmailSendFailed') })
        toast({
          title: t('errors.generic.error'),
          description: error.message,
          variant: "destructive",
        })
      } else {
        setMessage({
          type: "success",
          text: t('messages.success.resetLinkSent'),
        })
        toast({
          title: t('messages.success.emailSent'),
          description: t('messages.success.resetLinkSentShort'),
        })
      }
    } catch (error) {
      console.error("Reset password request error:", error)
      setMessage({ type: "error", text: t('errors.generic.unexpectedError') })
      toast({
        title: t('errors.generic.error'),
        description: t('errors.generic.unexpectedError'),
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
        setMessage({ type: "error", text: t('errors.validation.passwordMismatch') })
        return
      }
      if (password.length < 6) {
        setMessage({ type: "error", text: t('errors.validation.passwordLength') })
        return
      }

      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setMessage({ type: "error", text: error.message || t('errors.auth.passwordUpdateFailed') })
        toast({
          title: t('errors.generic.error'),
          description: error.message,
          variant: "destructive",
        })
      } else {
        setMessage({ type: "success", text: t('messages.success.passwordUpdatedRedirect') })
        toast({
          title: t('messages.success.passwordUpdated'),
          description: t('auth.login.newPasswordPrompt'),
        })
        router.push(`/${locale}/auth/login?reset=success`)
      }
    } catch (error) {
      console.error("Update password error:", error)
      setMessage({ type: "error", text: t('errors.generic.unexpectedError') })
      toast({
        title: t('errors.generic.error'),
        description: t('errors.generic.unexpectedError'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // access_tokenが存在する場合、新しいパスワードを設定するフォームを表示
  if (accessToken && refreshToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
        <div className="container mx-auto px-4 py-10 sm:py-14 lg:py-16">
          <div className="mx-auto w-full max-w-md sm:max-w-lg">
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-3xl font-bold text-slate-800 mb-2 drop-shadow-sm">{t('auth.reset.newPasswordTitle')}</h1>
              <p className="text-slate-700">{t('auth.reset.newPasswordSubtitle')}</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-blue-200">
              {message && (
                <Alert
                  variant={message.type === "error" ? "destructive" : "default"}
                  className={`mb-6 ${
                    message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                  }`}
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

              <form onSubmit={handleUpdatePassword} className="space-y-6" noValidate>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {t('forms.labels.newPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('forms.placeholders.newPasswordMin')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                      aria-pressed={showPassword}
                      aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    {t('forms.labels.confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t('forms.placeholders.confirmPassword')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                      aria-pressed={showConfirmPassword}
                      aria-label={showConfirmPassword ? t('auth.signup.hideConfirmPassword') : t('auth.signup.showConfirmPassword')}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-2xl transition-all duration-200"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? t('common.buttons.updating') : t('common.buttons.updatePassword')}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-2">{t('auth.reset.backToLogin')}</p>
                <Link href={`/${locale}/auth/login`} className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  {t('auth.login.title')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // access_tokenが存在しない場合、パスワードリセットメール送信フォームを表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      <div className="container mx-auto px-4 py-10 sm:py-14 lg:py-16">
        <div className="mx-auto w-full max-w-md sm:max-w-lg">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl font-bold text-slate-800 mb-2 drop-shadow-sm">{t('auth.reset.title')}</h1>
            <p className="text-slate-700">{t('auth.reset.subtitle')}</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-blue-200">
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

            <form onSubmit={handleResetPasswordRequest} className="space-y-6" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t('forms.labels.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('forms.placeholders.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-2xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? t('common.buttons.sending') : t('common.buttons.sendResetEmail')}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-2">{t('auth.reset.backToLogin')}</p>
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                {t('auth.login.title')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
