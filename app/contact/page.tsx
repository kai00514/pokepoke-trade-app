"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, MessageCircle, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { submitContactForm, type ContactFormData } from "@/lib/actions/contact"

export default function ContactPage() {
  const { user, userProfile } = useAuth()
  const [formData, setFormData] = useState<ContactFormData>({
    name: userProfile?.display_name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // エラーメッセージをクリア
    if (submitResult && !submitResult.success) {
      setSubmitResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const result = await submitContactForm(formData)
      setSubmitResult(result)

      if (result.success) {
        // フォームをリセット（名前とメールは保持）
        setFormData((prev) => ({
          ...prev,
          subject: "",
          message: "",
        }))
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        error: "システムエラーが発生しました。しばらく時間をおいて再度お試しください。",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-violet-600 hover:text-violet-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">お問い合わせ</h1>
          <p className="text-gray-600">ご質問やご要望がございましたら、お気軽にお問い合わせください。</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* メインフォーム */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  お問い合わせフォーム
                </CardTitle>
                <CardDescription className="text-violet-100">
                  以下のフォームにご記入の上、送信してください。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {submitResult && (
                  <Alert
                    className={`mb-6 ${submitResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                  >
                    <div className="flex items-center">
                      {submitResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      )}
                      <AlertDescription className={submitResult.success ? "text-green-800" : "text-red-800"}>
                        {submitResult.success ? submitResult.message : submitResult.error}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="山田 太郎"
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="example@email.com"
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      件名 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      placeholder="お問い合わせの件名を入力してください"
                      required
                      className="transition-all duration-200 focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      メッセージ <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="お問い合わせ内容を詳しくご記入ください"
                      required
                      rows={6}
                      className="transition-all duration-200 focus:ring-2 focus:ring-violet-500 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        送信中...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Mail className="w-4 h-4 mr-2" />
                        送信する
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
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-lg">
                <CardTitle className="text-lg">よくある質問</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">アカウントについて</h4>
                  <p className="text-sm text-gray-600">
                    ログインできない、パスワードを忘れた場合は、ログイン画面の「パスワードをお忘れですか？」からリセットできます。
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">トレード機能について</h4>
                  <p className="text-sm text-gray-600">
                    トレード投稿の作成・編集方法や、マッチング機能の使い方についてご不明な点がございましたらお問い合わせください。
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">技術的な問題</h4>
                  <p className="text-sm text-gray-600">
                    サイトの表示に問題がある場合は、ブラウザの種類とバージョンを併せてお知らせください。
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 連絡先情報 */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
                <CardTitle className="text-lg">その他の連絡方法</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-emerald-600" />
                  <div>
                    <div className="font-medium">メール</div>
                    <div>support@pokelnk.com</div>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-3 text-emerald-600" />
                  <div>
                    <div className="font-medium">対応時間</div>
                    <div>平日 10:00-18:00</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 注意事項 */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
                <CardTitle className="text-lg">ご注意</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• お返事まで1-3営業日いただく場合があります</li>
                  <li>• 迷惑メールフォルダもご確認ください</li>
                  <li>• 緊急の場合は直接メールでご連絡ください</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
