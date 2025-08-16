import { notFound } from "next/navigation"
import { ArticleEditor } from "@/components/admin/article-editor"
import { getArticleById } from "@/lib/actions/admin-articles"

interface EditArticlePageProps {
  params: {
    id: string
  }
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const id = Number.parseInt(params.id)

  if (isNaN(id)) {
    notFound()
  }

  const result = await getArticleById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return <ArticleEditor article={result.data} isEditing />
}
