"use client"

import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"

interface Tournament {
  id: number
  title: string
  event_date: string
  is_online: boolean
  benefit: string
  detail_url: string
}

const getTagColor = (isOnline: boolean) => {
  return isOnline ? "bg-green-100 text-green-800 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200"
}

const getTagLabel = (isOnline: boolean) => {
  return isOnline ? "オンライン" : "オフライン"
}

const formatEventDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TournamentCalendar() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/tournaments", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Fetched tournaments:", data) // Debug log

        setTournaments(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Failed to fetch tournaments:", error)
        setError("大会情報の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          読み込み中...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center text-red-500">{error}</div>
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center text-slate-500">現在開催予定の大会はありません。</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-200 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-black">大会名</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black">開催日時</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black">特典</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black">詳細</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tournaments.map((tournament) => (
              <tr key={tournament.id} className="hover:bg-slate-50 transition-colors duration-150">
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className="font-medium text-slate-900 text-sm">{tournament.title}</div>
                    <Badge className={`text-xs ${getTagColor(tournament.is_online)}`}>
                      {getTagLabel(tournament.is_online)}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs text-slate-900">{formatEventDate(tournament.event_date)}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs text-slate-900">{tournament.benefit || "なし"}</div>
                </td>
                <td className="px-4 py-4">
                  {tournament.detail_url && (
                    <a
                      href={tournament.detail_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors duration-150"
                      title="詳細を見る"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* もっと見るボタン */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-colors duration-150">
          すべての大会を見る →
        </button>
      </div>
    </div>
  )
}
