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
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, pokepoke_id, display_name, name, avatar_url, created_at")
      .eq("id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // User profile not found
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function createUserProfile(userId: string, email: string): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        display_name: email.split("@")[0],
        name: email.split("@")[0],
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error creating user profile:", error)
    return null
  }
}

export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}
