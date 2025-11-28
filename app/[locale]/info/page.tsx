import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import InfoSection from "@/components/info-section"
import LatestInfoSection from "@/components/info/latest-info-section"
import TournamentCalendar from "@/components/tournament-calendar"
import { Trophy, CalendarDays, ScrollText, BookMarked, GraduationCap } from "lucide-react"

export default function InformationPage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 text-center mb-8 sm:mb-12">
            インフォメーション
          </h1>

          <div className="space-y-12 sm:space-y-16">
            {/* 最新情報 */}
            <LatestInfoSection />

            {/* 大会カレンダー */}
            <InfoSection icon={CalendarDays} title="大会カレンダー" viewAllLink="/info/calendar">
              <TournamentCalendar />
            </InfoSection>

            {/* 以前のセクションを維持 */}
            <InfoSection icon={Trophy} title="公式トーナメント" viewAllLink="/info/tournaments">
              <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
                公式トーナメント情報がここに表示されます。
              </div>
            </InfoSection>

            <InfoSection icon={ScrollText} title="ルールの基本" viewAllLink="/info/rules">
              <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
                ルールの基本情報がここに表示されます。
              </div>
            </InfoSection>

            <InfoSection icon={BookMarked} title="用語集" viewAllLink="/info/glossary">
              <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
                用語集がここに表示されます。
              </div>
            </InfoSection>

            <InfoSection icon={GraduationCap} title="初心者向けガイド" viewAllLink="/info/guides">
              <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">
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
