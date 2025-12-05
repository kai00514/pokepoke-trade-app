import { Suspense } from "react"
import { Link } from "@/lib/i18n-navigation"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { getInfoList } from "@/lib/actions/info-articles"
import { getTranslations } from "next-intl/server"

export default async function NewsListPage() {
  const articles = await getInfoList(50, 0) // より多くの記事を取得
  const t = await getTranslations('info')

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
          <div className="mb-8">
            <Link
              href="/info"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('news.backToInfo')}
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('news.title')}</h1>
            <p className="text-slate-600">{t('news.subtitle')}</p>
          </div>

          <Suspense fallback={<div className="text-center py-8">{t('news.loading')}</div>}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link key={article.id} href={`/info/${article.id}`} className="group">
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={article.thumbnail_image_url || "/placeholder.svg?height=200&width=400"}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        {article.pinned && (
                          <Badge variant="destructive" className="text-xs font-medium">
                            {t('news.pinned')}
                          </Badge>
                        )}
                        {article.category && (
                          <Badge variant="secondary" className="text-xs font-medium">
                            {article.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <time dateTime={article.published_at}>
                          {new Date(article.published_at).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </Suspense>

          {articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">{t('news.noArticles')}</p>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  )
}
