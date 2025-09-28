"use server"

import { createClient } from "@/lib/supabase/server"

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function submitContactForm(prevState: any, formData: FormData) {
  try {
    // フォームデータを取得
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const subject = formData.get("subject") as string
    const message = formData.get("message") as string

    // バリデーション
    if (!name || name.trim().length < 2) {
      return {
        success: false,
        message: "お名前は2文字以上で入力してください。",
      }
    }

    if (!email || !email.includes("@")) {
      return {
        success: false,
        message: "有効なメールアドレスを入力してください。",
      }
    }

    if (!subject || subject.trim().length < 5) {
      return {
        success: false,
        message: "件名は5文字以上で入力してください。",
      }
    }

    if (!message || message.trim().length < 10) {
      return {
        success: false,
        message: "メッセージは10文字以上で入力してください。",
      }
    }

    const supabase = createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // データベースに保存
    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      user_id: user?.id || null,
      status: "pending",
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Database insert error:", insertError)
      return {
        success: false,
        message: "お問い合わせの送信中にエラーが発生しました。しばらく時間をおいて再度お試しください。",
      }
    }

    return {
      success: true,
      message:
        "お問い合わせを受け付けました。ご連絡いただきありがとうございます。内容を確認の上、後日ご返信いたします。",
    }
  } catch (error) {
    console.error("Contact form error:", error)
    return {
      success: false,
      message: "予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。",
    }
  }
}
