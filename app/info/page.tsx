import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import InfoSection from "@/components/info-section"
import { Newspaper, Trophy, CalendarDays, ScrollText, BookMarked, GraduationCap } from "lucide-react"
import NewsBannerCarousel from "@/components/news-banner-carousel"
import { fetchNewsList } from "@/lib/news"

export default async function InformationPage() {
  let latest: Awaited<ReturnType<typeof fetchNewsList>> = []
  try {
    latest = await fetchNewsList(5)
  } catch (e) {
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
        <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 sm:py-12">
          <h1 className="mb-8 text-center text-3xl font-bold text-slate-800 sm:mb-12 sm:text-4xl">
            インフォメーション
          </h1>

          <div className="space-y-12 sm:space-y-16">
            <InfoSection
              icon={<Newspaper className="h-6 w-6" />}
              title="最新情報"
              viewAllLink="/news"
              viewAllText="すべての最新情報を見る"
            >
              <NewsBannerCarousel items={latest} className="mt-1" />
            </InfoSection>

            <InfoSection icon={<Trophy className="h-6 w-6" />} title="公式トーナメント" viewAllLink="/info/tournaments">
              <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
                公式トーナメント情報がここに表示されます。
              </div>
            </InfoSection>

            <InfoSection
              icon={<CalendarDays className="h-6 w-6" />}
              title="大会カレンダー"
              viewAllLink="/info/calendar"
            >
              <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
                大会カレンダー情報がここに表示されます。
              </div>
            </InfoSection>

            <InfoSection icon={<ScrollText className="h-6 w-6" />} title="ルールの基本" viewAllLink="/info/rules">
              <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
                ルールの基本情報がここに表示されます。
              </div>
            </InfoSection>

            <InfoSection icon={<BookMarked className="h-6 w-6" />} title="用語集" viewAllLink="/info/glossary">
              <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
                用語集がここに表示されます。
              </div>
            </InfoSection>

            <InfoSection
              icon={<GraduationCap className="h-6 w-6" />}
              title="初心者向けガイド"
              viewAllLink="/info/guides"
            >
              <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
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
