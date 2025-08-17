import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { getInfoList } from "@/lib/actions/info-articles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function NewsPage() {
  const articles = await getInfoList()

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
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors">
                      <Link href={`/info/${article.id}`}>{article.title}</Link>
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                      {article.is_published ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">公開中</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          下書き
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4 line-clamp-3">
                    {article.summary || "記事の概要がここに表示されます。"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>
                      公開日: {new Date(article.published_at || article.created_at).toLocaleDateString("ja-JP")}
                    </span>
                    <Link
                      href={`/info/${article.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      詳細を見る →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
