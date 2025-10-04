"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

type ContactFormState = {
  success: boolean
  message: string
  error?: string
}

export async function submitContactForm(
  prevState: ContactFormState | undefined,
  formData: FormData,
): Promise<ContactFormState> {
  try {
    // フォームデータの取得
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const subject = formData.get("subject") as string
    const message = formData.get("message") as string

    // バリデーション
    if (!name || !email || !subject || !message) {
      return {
        success: false,
        message: "全ての項目を入力してください。",
      }
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: "有効なメールアドレスを入力してください。",
      }
    }

    // Supabase クライアントの作成（既存のパターンに従う）
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 現在のユーザーを取得（オプショナル）
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // データベースに保存
    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name,
      email,
      subject,
      message,
      user_id: user?.id || null,
    })

    if (insertError) {
      console.error("Contact form submission error:", insertError)
      return {
        success: false,
        message: "お問い合わせの送信に失敗しました。",
        error: insertError.message,
      }
    }

    return {
      success: true,
      message: "お問い合わせを受け付けました。ご連絡ありがとうございます。",
    }
  } catch (error) {
    console.error("Unexpected error in contact form submission:", error)
    return {
      success: false,
      message: "予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
