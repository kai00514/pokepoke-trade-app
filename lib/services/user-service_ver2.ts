import { createClient } from "@/lib/supabase/client"

export interface UserProfile {
  id: string
  pokepoke_id?: string | null
  display_name?: string | null
  name?: string | null
  avatar_url?: string | null
  created_at?: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log("🔍 [getUserProfile] START - Fetching user profile for:", userId)
  console.log("🔍 [getUserProfile] Timestamp:", new Date().toISOString())

  try {
    const supabase = createClient()
    console.log("🔍 [getUserProfile] Supabase client created")

    // セッション確認をスキップして直接データベースクエリを実行
    console.log("🔍 [getUserProfile] Skipping session check, executing direct database query")

    const { data, error } = await supabase
      .from("users")
      .select("id, pokepoke_id, display_name, name, avatar_url, created_at")
      .eq("id", userId)
      .single()

    console.log("🔍 [getUserProfile] Database query result:", {
      hasData: !!data,
      error: error?.message,
      dataKeys: data ? Object.keys(data) : null,
    })

    if (error) {
      if (error.code === "PGRST116") {
        console.log("🔍 [getUserProfile] No profile found for user:", userId)
        return null
      }
      console.error("❌ [getUserProfile] Database query error:", error)
      throw error
    }

    if (!data) {
      console.log("🔍 [getUserProfile] No data returned for user:", userId)
      return null
    }

    console.log("✅ [getUserProfile] Profile found:", {
      id: data.id,
      hasPokepoke: !!data.pokepoke_id,
      hasDisplayName: !!data.display_name,
      hasName: !!data.name,
      hasAvatar: !!data.avatar_url,
    })

    return data as UserProfile
  } catch (error) {
    console.error("❌ [getUserProfile] Unexpected error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
    })
    return null
  }
}

export async function createUserProfile(userId: string, userEmail: string): Promise<UserProfile | null> {
  console.log("🔧 [createUserProfile] START - Creating profile for:", userId, userEmail)

  try {
    const supabase = createClient()

    // セッション確認をスキップして直接データベース操作を実行
    console.log("🔧 [createUserProfile] Skipping session check, executing direct database operation")

    const displayName = userEmail.split("@")[0]
    const profileData = {
      id: userId,
      display_name: displayName,
      name: displayName,
      created_at: new Date().toISOString(),
    }

    console.log("🔧 [createUserProfile] Profile data to insert:", profileData)

    const { data, error } = await supabase.from("users").insert(profileData).select().single()

    console.log("🔧 [createUserProfile] Insert result:", {
      hasData: !!data,
      error: error?.message,
    })

    if (error) {
      console.error("❌ [createUserProfile] Insert error:", error)
      throw error
    }

    console.log("✅ [createUserProfile] Profile created successfully:", data)
    return data as UserProfile
  } catch (error) {
    console.error("❌ [createUserProfile] Unexpected error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      userEmail,
    })
    return null
  }
}

export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  console.log("🔧 [updateUserProfile] START - Direct table update:", { userId, profileData })

  try {
    const supabase = createClient()

    // セッション確認をスキップして直接データベース操作を実行
    console.log("🔧 [updateUserProfile] Skipping session check, executing direct database operation")

    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    console.log("🔧 [updateUserProfile] Update data:", updateData)

    const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

    console.log("🔧 [updateUserProfile] Update result:", {
      hasData: !!data,
      error: error?.message,
    })

    if (error) {
      console.error("❌ [updateUserProfile] Update error:", error)
      throw error
    }

    console.log("✅ [updateUserProfile] Profile updated successfully:", data)
    return data as UserProfile
  } catch (error) {
    console.error("❌ [updateUserProfile] Unexpected error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      profileData,
    })
    return null
  }
}
