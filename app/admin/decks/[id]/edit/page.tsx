import { DeckEditor } from "@/components/admin/deck-editor"

interface EditDeckPageProps {
  params: {
    id: string
  }
}

export default function EditDeckPage({ params }: EditDeckPageProps) {
  // TODO: デッキデータを取得
  const deckData = null // 後で実装

  return <DeckEditor deck={deckData} isEditing />
}
