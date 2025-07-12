"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GoogleIcon } from "@/components/icons/google-icon"
import { XIcon } from "@/components/icons/twitter-icon"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Mail, ArrowRight } from "lucide-react"

export default function SignupPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleEmailSignup = () => {
    // メール登録画面への遷移（実装予定）
    toast({
      title: "準備中",
      description: "メールアドレスでの登録機能は準備中です。",
      variant: "destructive",
    })
  }

  const handleSocialSignup = async (provider: "google" | "twitter") => {
    setLoading(provider)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "consent",
          },
        },
      })

      if (error) {
        toast({
          title: "登録エラー",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      // Code Flow 用の URL を受け取ってリダイレクト
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ソーシャル登録に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">会員登録</h1>
          <p className="text-purple-100">アカウントを作成してポケモンカードの取引を始めましょう</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="space-y-4">
            <Button
              onClick={handleEmailSignup}
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl flex items-center justify-between px-6"
            >
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3" />
                <span>メールアドレスで新規登録</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              onClick={() => handleSocialSignup("google")}
              variant="outline"
              className="w-full h-14 border-gray-200 hover:bg-gray-50 rounded-xl flex items-center justify-between px-6"
              disabled={loading === "google"}
            >
              <div className="flex items-center">
                <GoogleIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">{loading === "google" ? "登録中..." : "Googleで登録"}</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 border-gray-200 rounded-xl flex items-center justify-between px-6 opacity-50 cursor-not-allowed bg-transparent"
              disabled
            >
              <div className="flex items-center">
                <div className="w-5 h-5 mr-3 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">L</span>
                </div>
                <span className="font-medium text-gray-400">LINEで登録（準備中）</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Button>

            <Button
              onClick={() => handleSocialSignup("twitter")}
              variant="outline"
              className="w-full h-14 border-gray-200 hover:bg-gray-50 rounded-xl flex items-center justify-between px-6"
              disabled={loading === "twitter"}
            >
              <div className="flex items-center">
                <XIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">{loading === "twitter" ? "登録中..." : "Xで登録"}</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            ※ソーシャルログイン機能は現在ブラウザのみで提供しています。
          </div>

          <div className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
            会員登録は利用規約およびプライバシーポリシーに同意したとみなします。
            <br />
            ご確認の上、会員登録を進めてください。
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">すでにアカウントをお持ちの方</p>
            <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
