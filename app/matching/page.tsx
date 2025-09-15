"use client"

import { useState, useEffect } from "react"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Construction, CalendarClock } from "lucide-react"
import Link from "next/link"
import MatchingSurvey from "@/components/MatchingSurvey"
import MatchingThanks from "@/components/MatchingThanks"

export default function MatchingPage() {
  const [hasResponded, setHasResponded] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkSurveyStatus()
  }, [])

  const checkSurveyStatus = async () => {
    try {
      const response = await fetch("/api/survey/me")
      if (response.ok) {
        const data = await response.json()
        setHasResponded(data.hasResponded)
      } else {
        // Fallback to localStorage if API fails
        const localFlag = localStorage.getItem("matching_survey_done")
        setHasResponded(localFlag === "1")
      }
    } catch (error) {
      console.error("Failed to check survey status:", error)
      // Fallback to localStorage
      const localFlag = localStorage.getItem("matching_survey_done")
      setHasResponded(localFlag === "1")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSurveySuccess = () => {
    setHasResponded(true)
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
        <main className="container mx-auto px-4 py-6 flex flex-col items-center justify-center text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">マッチング</h1>

          {/* Coming Soon Card */}
          <Card className="w-full max-w-md p-6 shadow-lg">
            <CardContent className="flex flex-col items-center gap-6 p-0">
              <div className="bg-violet-100 p-4 rounded-full">
                <Construction className="h-12 w-12 text-blue-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Coming Soon！</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  マッチング機能は現在開発中です。
                  <br />
                  より良いトレード体験をご提供するために準備を進めています。
                </p>
              </div>
              <Link
                href="#"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                近日公開予定
              </Link>
            </CardContent>
          </Card>

          {/* Survey or Thanks Card */}
          {!isLoading && (hasResponded ? <MatchingThanks /> : <MatchingSurvey onSuccess={handleSurveySuccess} />)}
        </main>
      </div>
      <Footer />
    </div>
  )
}
