"use server"

import { createClient } from "@/lib/supabase/server"

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  userId?: string
}

export async function submitContactForm(formData: FormData) {
  try {
    const supabase = createClient()

    // 現在のユーザーを取得（ログインしている場合）
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const contactData: ContactFormData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
      userId: user?.id || undefined,
    }

    // バリデーション
    if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
      return {
        success: false,
        error: "全ての項目を入力してください。",
      }
    }

    // メールアドレスの簡単なバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactData.email)) {
      return {
        success: false,
        error: "有効なメールアドレスを入力してください。",
      }
    }

    // お問い合わせデータをデータベースに保存
    const { error } = await supabase.from("contact_submissions").insert([
      {
        name: contactData.name,
        email: contactData.email,
        subject: contactData.subject,
        message: contactData.message,
        user_id: contactData.userId,
        created_at: new Date().toISOString(),
        status: "pending",
      },
    ])

    if (error) {
      console.error("Contact form submission error:", error)
      return {
        success: false,
        error: "お問い合わせの送信に失敗しました。しばらく時間をおいて再度お試しください。",
      }
    }

    return {
      success: true,
      message: "お問い合わせを受け付けました。ご連絡いただきありがとうございます。",
    }
  } catch (error) {
    console.error("Contact form submission error:", error)
    return {
      success: false,
      error: "お問い合わせの送信中にエラーが発生しました。",
    }
  }
}
