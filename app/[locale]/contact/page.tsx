"use client"

import { useActionState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, MessageCircle, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Link } from "@/lib/i18n-navigation"
import { submitContactForm } from "@/lib/actions/contact"
import { useTranslations } from "next-intl"

const initialState = {
  success: false,
  message: "",
}

export default function ContactPage() {
  const t = useTranslations()
  const { user, userProfile } = useAuth()
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t('common.navigation.backToTimeline')}</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('pages.contact.title')}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('pages.contact.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* メインフォーム */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MessageCircle className="w-6 h-6" />
                    {t('pages.contact.form.title')}
                  </CardTitle>
                  <CardDescription className="text-blue-100">{t('pages.contact.form.description')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {state?.message && (
                    <Alert
                      className={`mb-6 ${state.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                    >
                      <div className="flex items-center gap-2">
                        {state.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <AlertDescription className={state.success ? "text-green-800" : "text-red-800"}>
                          {state.message}
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}

                  <form action={formAction} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('forms.labels.name')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          defaultValue={userProfile?.display_name || ""}
                          placeholder={t('forms.placeholders.name')}
                          required
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('forms.labels.email')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={user?.email || ""}
                          placeholder="example@email.com"
                          required
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('forms.labels.subject')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder={t('forms.placeholders.subject')}
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('forms.labels.message')} <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder={t('forms.placeholders.message')}
                        required
                        rows={6}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {t('common.buttons.sending')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          {t('common.buttons.send')}
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* よくある質問 */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg">{t('pages.contact.faq.title')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('pages.contact.faq.q1')}</h4>
                    <p className="text-sm text-gray-600">{t('pages.contact.faq.a1')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('pages.contact.faq.q2')}</h4>
                    <p className="text-sm text-gray-600">
                      {t('pages.contact.faq.a2')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('pages.contact.faq.q3')}</h4>
                    <p className="text-sm text-gray-600">{t('pages.contact.faq.a3')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 連絡先情報 */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg">{t('pages.contact.contactInfo.title')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{t('pages.contact.contactInfo.email')}</p>
                      <p className="text-sm text-gray-600">support@pokelink.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{t('pages.contact.contactInfo.hours')}</p>
                      <p className="text-sm text-gray-600">{t('pages.contact.contactInfo.hoursValue')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 注意事項 */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg">{t('pages.contact.notice.title')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• {t('pages.contact.notice.item1')}</li>
                    <li>• {t('pages.contact.notice.item2')}</li>
                    <li>• {t('pages.contact.notice.item3')}</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
