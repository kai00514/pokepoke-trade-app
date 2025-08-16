"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { DeckTable } from "./deck-table"

interface DeckPage {
  id: string
  title: string
  deck_name: string
  category: string
  tier_rank: string
  tier_name: string
  is_published: boolean
  view_count: number
  like_count: number
  favorite_count: number
  created_at: string
  updated_at: string
  thumbnail_image_url?: string
}

interface DecksPageClientProps {
  initialDecks: DeckPage[]
}

const categories = [
  { value: "", label: "すべて" },
  { value: "tier", label: "Tier" },
  { value: "featured", label: "注目" },
  { value: "newpack", label: "新パック" },
]

const tierRanks = [
  { value: "", label: "すべて" },
  { value: "SS", label: "SS" },
  { value: "S", label: "S" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
]

export function DecksPageClient({ initialDecks }: DecksPageClientProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [tierFilter, setTierFilter] = useState("")

  const filteredDecks = initialDecks.filter((deck) => {
    const matchesSearch =
      deck.title.toLowerCase().includes(search.toLowerCase()) ||
      deck.deck_name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !category || deck.category === category
    const matchesTier = !tierFilter || deck.tier_rank === tierFilter

    return matchesSearch && matchesCategory && matchesTier
  })

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="デッキを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="カテゴリーで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tierで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            {tierRanks.map((tier) => (
              <SelectItem key={tier.value} value={tier.value}>
                {tier.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* テーブル */}
      <DeckTable decks={filteredDecks} />
    </div>
  )
}
