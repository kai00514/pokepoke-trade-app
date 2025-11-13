export interface CollageData {
  id: string
  user_id: string
  title1: string
  card_ids_1: number[]
  title2: string
  card_ids_2: number[]
  created_at: string
  updated_at: string
}

export interface CollageListItem {
  id: string
  title1: string
  title2: string
  cardCount1: number
  cardCount2: number
  created_at: string
  thumbnail_url?: string
}
