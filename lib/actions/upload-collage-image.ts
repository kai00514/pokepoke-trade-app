"use server"

import { createClient } from "@/lib/supabase/server"

export async function uploadCollageImage(imageBuffer: Buffer, collageId: string) {
  const supabase = await createClient()
  const filePath = `collages/${collageId}.png`

  try {
    const { data, error } = await supabase.storage.from("collages").upload(filePath, imageBuffer, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: true, // Allow re-generating
    })

    if (error) {
      console.error("Upload error:", error)
      throw new Error(error.message)
    }

    const { data: urlData } = supabase.storage.from("collages").getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error("Error in uploadCollageImage:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "画像のアップロードに失敗しました",
    }
  }
}

export async function deleteCollageImage(path: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.storage.from("collages").remove([path])

    if (error) {
      console.error("Delete error:", error)
      return { success: false, error: "画像の削除に失敗しました" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteCollageImage:", error)
    return { success: false, error: "画像の削除に失敗しました" }
  }
}
