export interface UserProfile {
  id: string
  pokepoke_id?: string | null
  display_name?: string | null
  name?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface UserProfileUpdate {
  pokepoke_id?: string
  display_name?: string
  name?: string
  avatar_url?: string
}
