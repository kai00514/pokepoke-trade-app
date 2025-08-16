"use server"

import { createClient } from "@/lib/supabase/server"

export async function uploadImage(formData: FormData) {
  const supabase = await createClient()
  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "ファイルが選択されていません" }
  }

  // ファイルサイズチェック (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "ファイルサイズは5MB以下にしてください" }
  }

  // ファイル形式チェック
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "対応していないファイル形式です" }
  }

  try {
    // ファイル名を生成
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `articles/material/${fileName}`

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage.from("articles").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Upload error:", error)
      return { success: false, error: "画像のアップロードに失敗しました" }
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage.from("articles").getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error("Error in uploadImage:", error)
    return { success: false, error: "画像のアップロードに失敗しました" }
  }
}

export async function deleteImage(path: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.storage.from("articles").remove([path])

    if (error) {
      console.error("Delete error:", error)
      return { success: false, error: "画像の削除に失敗しました" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteImage:", error)
    return { success: false, error: "画像の削除に失敗しました" }
  }
}
