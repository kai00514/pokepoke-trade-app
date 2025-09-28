"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export interface ContactSubmissionResult {
  success: boolean
  message: string
  error?: string
}

export async function submitContactForm(formData: ContactFormData): Promise<ContactSubmissionResult> {
  try {
    // バリデーション
    if (!formData.name || formData.name.trim().length < 2) {
      return {
        success: false,
        message: "お名前は2文字以上で入力してください。",
      }
    }

    if (!formData.email || !isValidEmail(formData.email)) {
      return {
        success: false,
        message: "有効なメールアドレスを入力してください。",
      }
    }

    if (!formData.subject || formData.subject.trim().length < 5) {
      return {
        success: false,
        message: "件名は5文字以上で入力してください。",
      }
    }

    if (!formData.message || formData.message.trim().length < 10) {
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
    const { error } = await supabase.from("contact_submissions").insert({
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      user_id: user?.id || null,
      status: "pending",
    })

    if (error) {
      console.error("Contact form submission error:", error)
      return {
        success: false,
        message: "お問い合わせの送信中にエラーが発生しました。しばらく時間をおいて再度お試しください。",
        error: error.message,
      }
    }

    // 成功時はページを再検証
    revalidatePath("/contact")

    return {
      success: true,
      message:
        "お問い合わせを受け付けました。ご連絡いただきありがとうございます。内容を確認の上、後日ご返信いたします。",
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

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
