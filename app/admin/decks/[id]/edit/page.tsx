import { notFound } from "next/navigation"
import { DeckEditor } from "@/components/admin/deck-editor"
import { getDeckById } from "@/lib/actions/admin-decks"

interface EditDeckPageProps {
  params: {
    id: string
  }
}

export default async function EditDeckPage({ params }: EditDeckPageProps) {
  const result = await getDeckById(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  return <DeckEditor deck={result.data} isEditing />
}
