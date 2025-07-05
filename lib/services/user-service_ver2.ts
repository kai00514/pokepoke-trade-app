import { createClient } from "@/lib/supabase/client"

export interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  name?: string
  avatar_url?: string
  created_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log("🔍 [getUserProfile] Fetching profile for:", userId)

  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, pokepoke_id, display_name, name, avatar_url, created_at")
      .eq("id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        console.log("🔍 [getUserProfile] No profile found")
        return null
      }
      throw error
    }

    console.log("✅ [getUserProfile] Profile found:", data)
    return data
  } catch (error) {
    console.error("❌ [getUserProfile] Error:", error)
    return null
  }
}

export async function createUserProfile(userId: string, email: string): Promise<UserProfile> {
  console.log("🔧 [createUserProfile] Creating profile for:", userId)

  const supabase = createClient()

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      display_name: email.split("@")[0],
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  console.log("✅ [createUserProfile] Profile created:", data)
  return data
}

export async function updateUserProfile(
  userId: string,
  profileData: {
    display_name?: string
    pokepoke_id?: string
    name?: string
    avatar_url?: string
  },
) {
  console.log("🔧 [updateUserProfile] Updating profile:", userId)

  const supabase = createClient()

  const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

  if (error) {
    throw error
  }

  console.log("✅ [updateUserProfile] Profile updated:", data)
  return data
}
