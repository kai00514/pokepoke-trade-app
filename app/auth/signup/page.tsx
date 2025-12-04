"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleIcon } from "@/components/icons/google-icon"
import { XIcon } from "@/components/icons/twitter-icon"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowRight, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { event as gtagEvent } from "@/lib/analytics/gtag"
import { useTranslations } from "next-intl"

export default function SignupPage() {
  const t = useTranslations()
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
      if (password !== confirmPassword) {
        setErrorMessage(t('errors.validation.passwordMismatch'))
        return
      }

      if (password.length < 6) {
        setErrorMessage(t('errors.validation.passwordLength'))
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
            title: t('errors.auth.alreadyRegistered'),
            description: t('errors.auth.alreadyRegisteredDesc'),
            variant: "destructive",
          })
          return
        } else if (error.message.includes("Invalid email")) {
          setErrorMessage(t('errors.validation.invalidEmail'))
        } else {
          setErrorMessage(error.message || t('errors.auth.signupFailed'))
        }
        toast({
          title: t('errors.auth.signupError'),
          description: error.message,
          variant: "destructive",
        })
      } else if (data.user && !data.session) {
        setSuccessMessage(t('messages.success.confirmationEmailSentLong'))
        toast({
          title: t('messages.success.confirmationSent'),
          description: t('messages.success.checkEmail'),
        })
      } else if (data.session) {
        gtagEvent("user_registered", {
          category: "conversion",
          method: "email",
          label: "email_signup",
        })

        toast({
          title: t('messages.success.signupComplete'),
          description: t('messages.success.accountCreated'),
        })
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Signup error:", error)
      const errorMsg = t('errors.auth.accountCreationFailed')
      setErrorMessage(errorMsg)
      toast({
        title: t('errors.generic.error'),
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
      const options: any = {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "consent",
        },
      }

      // X (Twitter) の場合、メールアドレス取得のためのスコープを追加
      if (provider === "twitter") {
        options.scopes = "tweet.read users.read offline.access"
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      })

      if (error) {
        toast({
          title: t('errors.auth.signupError'),
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (data?.url) {
        gtagEvent("user_registered", {
          category: "conversion",
          method: provider,
          label: `${provider}_signup_initiated`,
        })

        window.location.href = data.url
      }
    } catch (error) {
      console.error("Social signup error:", error)
      toast({
        title: t('errors.generic.error'),
        description: t('errors.auth.socialSignupFailed'),
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  // メールフォーム表示時
  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
        <div className="container mx-auto px-4 py-10 sm:py-14 lg:py-16">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-3xl font-bold text-slate-800 mb-2 drop-shadow-sm">{t('auth.signup.emailFormTitle')}</h1>
              <p className="text-slate-700">{t('auth.signup.emailFormSubtitle')}</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-blue-200">
              {errorMessage && (
                <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50" aria-live="polite">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="mb-6 border-green-200 bg-green-50" aria-live="polite">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleEmailSignup} className="space-y-6" noValidate>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    {t('forms.labels.email')}
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500"
                      aria-hidden="true"
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('forms.placeholders.email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                      required
                      autoComplete="email"
                      aria-invalid={!!errorMessage || undefined}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {t('forms.labels.password')}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500"
                      aria-hidden="true"
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('forms.placeholders.passwordMin')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      aria-invalid={!!errorMessage || undefined}
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
                  <p className="text-xs text-gray-500">{t('forms.hints.passwordRecommendation')}</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    {t('forms.labels.confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500"
                      aria-hidden="true"
                    />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t('forms.placeholders.confirmPassword')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                      required
                      autoComplete="new-password"
                      aria-invalid={!!errorMessage || undefined}
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
                  disabled={loading === "email"}
                  aria-busy={loading === "email"}
                >
                  {loading === "email" ? t('common.buttons.submitting') : t('common.buttons.createAccount')}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowEmailForm(false)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50/30 transition-colors"
                >
                  {t('common.buttons.backToOptions')}
                </Button>
              </div>

              <div className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
                {t('auth.signup.termsAgreement')}
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-2">{t('auth.signup.loginPrompt')}</p>
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

  // メールフォーム未表示時（選択画面）
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      <div className="container mx-auto px-4 py-10 sm:py-14 lg:py-16">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl font-bold text-slate-800 mb-2 drop-shadow-sm">{t('auth.signup.title')}</h1>
            <p className="text-slate-700">{t('auth.signup.subtitle')}</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-blue-200">
            <div className="space-y-4">
              <Button
                onClick={() => setShowEmailForm(true)}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-between px-6 shadow-2xl transition-all duration-200"
              >
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3" />
                  <span>{t('common.buttons.signupWithEmail')}</span>
                </div>
                <ArrowRight className="h-5 w-5" />
              </Button>

              <Button
                onClick={() => handleSocialSignup("google")}
                variant="outline"
                className="w-full h-14 border-blue-200 hover:bg-blue-50 hover:border-blue-400 rounded-xl flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm transition-all duration-200"
                disabled={loading === "google"}
              >
                <div className="flex items-center">
                  <GoogleIcon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{loading === "google" ? t('common.buttons.submitting') : t('common.buttons.signupWithGoogle')}</span>
                </div>
                <ArrowRight className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 border-blue-200 rounded-xl flex items-center justify-between px-6 opacity-50 cursor-not-allowed bg-white/60 backdrop-blur-sm"
                disabled
              >
                <div className="flex items-center">
                  <div className="w-5 h-5 mr-3 bg-green-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">L</span>
                  </div>
                  <span className="font-medium text-gray-400">{t('common.buttons.signupWithLine')}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Button>

              <Button
                onClick={() => handleSocialSignup("twitter")}
                variant="outline"
                className="w-full h-14 border-blue-200 hover:bg-blue-50 hover:border-blue-400 rounded-xl flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm transition-all duration-200"
                disabled={loading === "twitter"}
              >
                <div className="flex items-center">
                  <XIcon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{loading === "twitter" ? t('common.buttons.submitting') : t('common.buttons.signupWithX')}</span>
                </div>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              {t('auth.login.socialLoginNote')}
            </div>

            <div className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
              {t('auth.signup.termsAgreement')}
              <br />
              {t('auth.signup.confirmationNote')}
            </div>

            <div className="mt-10 text-center">
              <p className="text-gray-600 mb-2">{t('auth.signup.loginPrompt')}</p>
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
