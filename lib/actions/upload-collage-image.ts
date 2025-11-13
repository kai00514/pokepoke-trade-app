"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function uploadCollageImage(imageBuffer: Buffer, collageId: string) {
  const filePath = `${collageId}.png`

  try {
    const { data, error } = await supabase.storage.from("collages").upload(filePath, imageBuffer, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Upload error:", error)
      throw new Error(error.message)
    }

    const { data: urlData } = supabase.storage.from("collages").getPublicUrl(filePath)

    console.log("[uploadCollageImage] ✅ Upload successful:", urlData.publicUrl)

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
  try {
    const { error } = await supabase.storage.from("collages").remove([path])

    if (error) {
      console.error("Delete error:", error)
      return { success: false, error: "画像の削除に失敗しました" }
    }

    console.log("[deleteCollageImage] ✅ Delete successful:", path)

    return { success: true }
  } catch (error) {
    console.error("Error in deleteCollageImage:", error)
    return { success: false, error: "画像の削除に失敗しました" }
  }
}
