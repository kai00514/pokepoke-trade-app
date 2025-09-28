"use server"

import { createClient } from "@/lib/supabase/server"

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function submitContactForm(formData: ContactFormData) {
  try {
    const supabase = await createClient()

    // バリデーション
    if (!formData.name || formData.name.trim().length < 2) {
      return {
        success: false,
        error: "お名前は2文字以上で入力してください。",
      }
    }

    if (!formData.email || !formData.email.includes("@")) {
      return {
        success: false,
        error: "有効なメールアドレスを入力してください。",
      }
    }

    if (!formData.subject || formData.subject.trim().length < 5) {
      return {
        success: false,
        error: "件名は5文字以上で入力してください。",
      }
    }

    if (!formData.message || formData.message.trim().length < 10) {
      return {
        success: false,
        error: "メッセージは10文字以上で入力してください。",
      }
    }

    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // お問い合わせをデータベースに保存
    const { error: insertError } = await supabase.from("contact_submissions").insert({
      user_id: user?.id || null,
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      status: "pending",
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Contact form submission error:", insertError)
      return {
        success: false,
        error: "お問い合わせの送信に失敗しました。しばらく時間をおいて再度お試しください。",
      }
    }

    // 管理者に通知を送信（実装は後で）
    // await sendNotificationToAdmin(formData)

    return {
      success: true,
      message: "お問い合わせを受け付けました。ご連絡いただきありがとうございます。",
    }
  } catch (error) {
    console.error("Contact form error:", error)
    return {
      success: false,
      error: "システムエラーが発生しました。しばらく時間をおいて再度お試しください。",
    }
  }
}
