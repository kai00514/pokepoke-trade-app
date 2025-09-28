"use server"

import { createClient } from "@/lib/supabase/server"
// import { revalidatePath } from "next/cache"

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
    const validation = validateContactForm(formData)
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || "入力内容に問題があります。",
      }
    }

    const supabase = createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
    }

    // データベースに保存
    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      user_id: user?.id || null,
      status: "pending",
    })

    if (insertError) {
      console.error("Database insert error:", insertError)
      return {
        success: false,
        message: "お問い合わせの送信中にエラーが発生しました。しばらく時間をおいて再度お試しください。",
        error: insertError.message,
      }
    }

    // 成功時はページを再検証
    // revalidatePath("/contact")

    return {
      success: true,
      message:
        "お問い合わせを受け付けました。ご連絡いただきありがとうございます。内容を確認の上、後日ご返信いたします。",
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return {
      success: false,
      message: "予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function validateContactForm(formData: ContactFormData): { isValid: boolean; error?: string } {
  if (!formData.name || formData.name.trim().length < 2) {
    return { isValid: false, error: "お名前は2文字以上で入力してください。" }
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    return { isValid: false, error: "有効なメールアドレスを入力してください。" }
  }

  if (!formData.subject || formData.subject.trim().length < 5) {
    return { isValid: false, error: "件名は5文字以上で入力してください。" }
  }

  if (!formData.message || formData.message.trim().length < 10) {
    return { isValid: false, error: "メッセージは10文字以上で入力してください。" }
  }

  return { isValid: true }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
