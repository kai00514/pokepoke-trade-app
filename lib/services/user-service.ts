import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null
  }
}

export async function createUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createUserProfile:", error)
    return null
  }
}

export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    console.log("🔧 [updateUserProfile] START - Function called")
    console.log("🔧 [updateUserProfile] Input userId:", userId)
    console.log("🔧 [updateUserProfile] Input profileData:", profileData)

    const supabase = createClient()
    console.log("🔧 [updateUserProfile] Supabase client created")

    // 更新前のデータを確認
    console.log("🔧 [updateUserProfile] Checking current data before update...")
    const { data: currentData, error: selectError } = await supabase.from("users").select("*").eq("id", userId).single()

    console.log("🔧 [updateUserProfile] Current data:", currentData)
    console.log("🔧 [updateUserProfile] Select error:", selectError)

    // 更新データの準備
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }
    console.log("🔧 [updateUserProfile] Update data prepared:", updateData)

    // 更新実行
    console.log("🔧 [updateUserProfile] Executing update query...")
    const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

    console.log("🔧 [updateUserProfile] Update result - data:", data)
    console.log("🔧 [updateUserProfile] Update result - error:", error)

    if (error) {
      console.error("🔧 [updateUserProfile] ERROR - Update failed:", error)
      console.error("🔧 [updateUserProfile] ERROR - Error code:", error.code)
      console.error("🔧 [updateUserProfile] ERROR - Error message:", error.message)
      console.error("🔧 [updateUserProfile] ERROR - Error details:", error.details)
      return null
    }

    console.log("🔧 [updateUserProfile] SUCCESS - Update completed")
    console.log("🔧 [updateUserProfile] SUCCESS - Returning data:", data)
    return data
  } catch (error) {
    console.error("🔧 [updateUserProfile] CATCH ERROR - Exception occurred:", error)
    console.error("🔧 [updateUserProfile] CATCH ERROR - Error type:", typeof error)
    console.error(
      "🔧 [updateUserProfile] CATCH ERROR - Error stack:",
      error instanceof Error ? error.stack : "No stack",
    )
    return null
  }
}
