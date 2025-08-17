import { notFound } from "next/navigation"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { getInfoDetailById } from "@/lib/actions/info-articles"
import { getInfoPageById } from "@/lib/actions/admin-deck-pages"
import { RenderArticle } from "@/components/info/render-article"

interface InfoDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InfoDetailPage({ params }: InfoDetailPageProps) {
  const { id } = await params

  try {
    // 記事詳細を取得
    const article = await getInfoDetailById(id)

    // デッキページ詳細も取得（エラーは無視）
    let deckPageData = null
    try {
      deckPageData = await getInfoPageById(id)
    } catch (error) {
      console.warn("Deck page data not found:", error)
    }

    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div
          className="w-full flex-1"
          style={{
            background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)",
          }}
        >
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <RenderArticle article={article} deckPageData={deckPageData} />
          </main>
        </div>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error("Error fetching article:", error)
    notFound()
  }
}
