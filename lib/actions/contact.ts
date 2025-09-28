"use server"

import { createClient } from "@/lib/supabase/server"

export async function submitContact(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient()

    // フォームデータを取得
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const subject = formData.get("subject") as string
    const message = formData.get("message") as string

    // バリデーション
    if (!name || !email || !subject || !message) {
      return {
        success: false,
        message: "すべての項目を入力してください。",
      }
    }

    if (!email.includes("@")) {
      return {
        success: false,
        message: "有効なメールアドレスを入力してください。",
      }
    }

    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // データベースに保存
    const { error } = await supabase.from("contact_submissions").insert({
      name,
      email,
      subject,
      message,
      user_id: user?.id || null,
      status: "pending",
    })

    if (error) {
      console.error("Contact submission error:", error)
      return {
        success: false,
        message: "お問い合わせの送信に失敗しました。しばらく時間をおいて再度お試しください。",
      }
    }

    return {
      success: true,
      message: "お問い合わせを送信しました。ご連絡いただきありがとうございます。",
    }
  } catch (error) {
    console.error("Contact form error:", error)
    return {
      success: false,
      message: "予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。",
    }
  }
}
