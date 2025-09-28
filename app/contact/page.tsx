"use client"

import { useActionState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { submitContact } from "@/lib/actions/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  const { user } = useAuth()
  const [state, formAction, isPending] = useActionState(submitContact, null)

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">お問い合わせ</h1>
          <p className="text-gray-600">ご質問やご要望がございましたら、お気軽にお問い合わせください。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* お問い合わせフォーム */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>お問い合わせフォーム</CardTitle>
                <CardDescription>以下のフォームにご記入いただき、送信してください。</CardDescription>
              </CardHeader>
              <CardContent>
                {state?.message && (
                  <Alert
                    className={`mb-6 ${state.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                  >
                    {state.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={state.success ? "text-green-800" : "text-red-800"}>
                      {state.message}
                    </AlertDescription>
                  </Alert>
                )}

                <form action={formAction} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        defaultValue={user?.user_metadata?.full_name || ""}
                        className="w-full"
                        placeholder="山田太郎"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        defaultValue={user?.email || ""}
                        className="w-full"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      件名 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      className="w-full"
                      placeholder="お問い合わせの件名を入力してください"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      メッセージ <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      className="w-full"
                      placeholder="お問い合わせ内容を詳しくご記入ください"
                    />
                  </div>

                  <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700">
                    {isPending ? "送信中..." : "送信する"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* よくある質問 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">よくある質問</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">アカウントについて</h4>
                  <p className="text-sm text-gray-600">ログインやアカウント設定に関するご質問</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">トレード機能について</h4>
                  <p className="text-sm text-gray-600">カード交換やリスト作成に関するご質問</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">技術的な問題</h4>
                  <p className="text-sm text-gray-600">サイトの動作やエラーに関するご質問</p>
                </div>
              </CardContent>
            </Card>

            {/* 連絡先情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">連絡先情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">メール</p>
                    <p className="text-sm text-gray-600">support@pokelnk.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">対応時間</p>
                    <p className="text-sm text-gray-600">平日 9:00-18:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 注意事項 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ご注意</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• お返事まで2-3営業日いただく場合があります</li>
                  <li>• 緊急の場合は件名に【緊急】と記載してください</li>
                  <li>• スパムメールフィルターをご確認ください</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
