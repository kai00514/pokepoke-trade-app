import { notFound } from "next/navigation"
import { DeckEditor } from "@/components/admin/deck-editor"
import { getDeckById } from "@/lib/actions/admin-decks"

interface EditDeckPageProps {
  params: {
    id: string
  }
}

export default async function EditDeckPage({ params }: EditDeckPageProps) {
  const result = await getDeckById(Number.parseInt(params.id))

  if (!result.success) {
    notFound()
  }

  return <DeckEditor initialData={result.data} isEditing />
}
