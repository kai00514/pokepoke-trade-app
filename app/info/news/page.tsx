import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { getInfoList } from "@/lib/actions/info-articles"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

export default async function NewsPage() {
  const articles = await getInfoList(50, 0) // より多くの記事を取得

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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 text-center mb-8 sm:mb-12">最新情報</h1>

          <div className="grid gap-6 md:gap-8">
            {articles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {/* サムネイル画像 */}
                    {article.thumbnail_image_url && (
                      <div className="flex-shrink-0">
                        <Image
                          src={article.thumbnail_image_url || "/placeholder.svg"}
                          alt={article.title}
                          width={120}
                          height={80}
                          className="rounded-lg object-cover"
                          sizes="120px"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <CardTitle className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">
                          <Link href={`/info/${article.id}`}>{article.title}</Link>
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                          {article.category && (
                            <Badge variant="secondary" className="text-xs">
                              {article.category}
                            </Badge>
                          )}
                          {article.pinned && <Badge className="bg-red-100 text-red-800 text-xs">ピン留め</Badge>}
                        </div>
                      </div>

                      {/* 記事の概要 */}
                      {article.excerpt && <p className="text-slate-600 mb-3 line-clamp-2 text-sm">{article.excerpt}</p>}

                      {/* タグ */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {article.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>公開日: {new Date(article.published_at).toLocaleDateString("ja-JP")}</span>
                        <Link
                          href={`/info/${article.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          詳細を見る →
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {articles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg">最新情報はまだありません。</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
