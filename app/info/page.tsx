import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import InfoSection from "@/components/info-section"
import NewsBannerCarousel from "@/components/news-banner-carousel"
import { fetchNewsList } from "@/lib/news"
import { Newspaper, Trophy, CalendarDays, ScrollText, BookMarked, GraduationCap } from "lucide-react"

export default async function InformationPage() {
  let latest = []
  try {
    latest = await fetchNewsList(5)
  } catch (e) {
    // 取得に失敗した場合は空配列のまま表示（空状態はカルーセル内でハンドリングされる想定）
    console.error(e)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div
        className="w-full flex-1"
        style={{
          background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)",
        }}
      >
        <main className="container mx-auto flex-grow px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 text-center mb-8 sm:mb-12">
            インフォメーション
          </h1>

          <div className="space-y-12 sm:space-y-16">
            {/* 最新情報（microCMS連携のカルーセル） */}
            <InfoSection
              icon={<Newspaper className="h-6 w-6 text-slate-700" />}
              title="最新情報"
              viewAllLink="/news"
              viewAllText="すべての最新情報を見る"
            >
              <NewsBannerCarousel items={latest} className="mt-2" />
            </InfoSection>

            {/* 公式トーナメント */}
            <InfoSection
              icon={<Trophy className="h-6 w-6 text-slate-700" />}
              title="公式トーナメント"
              viewAllLink="/info/tournaments"
            >
              <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-600">
                公式トーナメント情報がここに表示されます。
              </div>
            </InfoSection>

            {/* 大会カレンダー */}
            <InfoSection
              icon={<CalendarDays className="h-6 w-6 text-slate-700" />}
              title="大会カレンダー"
              viewAllLink="/info/calendar"
            >
              <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-600">
                大会カレンダー情報がここに表示されます。
              </div>
            </InfoSection>

            {/* ルールの基本 */}
            <InfoSection
              icon={<ScrollText className="h-6 w-6 text-slate-700" />}
              title="ルールの基本"
              viewAllLink="/info/rules"
            >
              <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-600">
                ルールの基本情報がここに表示されます。
              </div>
            </InfoSection>

            {/* 用語集 */}
            <InfoSection
              icon={<BookMarked className="h-6 w-6 text-slate-700" />}
              title="用語集"
              viewAllLink="/info/glossary"
            >
              <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-600">
                用語集がここに表示されます。
              </div>
            </InfoSection>

            {/* 初心者向けガイド */}
            <InfoSection
              icon={<GraduationCap className="h-6 w-6 text-slate-700" />}
              title="初心者向けガイド"
              viewAllLink="/info/guides"
            >
              <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-600">
                初心者向けガイドがここに表示されます。
              </div>
            </InfoSection>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
