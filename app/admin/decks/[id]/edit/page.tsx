import { getDeckById } from "@/lib/actions/admin-decks"
import { DeckEditor } from "@/components/admin/deck-editor"
import { notFound } from "next/navigation"

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

  return (
    <div className="container mx-auto py-6">
      <DeckEditor initialData={result.data} isEditing={true} deckId={params.id} />
    </div>
  )
}
