"use client"

import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

// サンプルデータ（後でデータベースから取得）
const sampleTournaments = [
  {
    id: 1,
    name: "たなごんと愉快な仲間たちのイベント",
    tag: "オンライン",
    date: "2025年9月16日 19:00",
    benefits: "なし",
    detailUrl: "https://e-spogate.net/%e3%81%9f%e3%81%aa%e3%81%94%e3%82%93%e3%81%a8%e6%84%89%e5%bf%ab%e3%81%aa%e4%bb%b2%e9%96%93%e3%81%9f%e3%81%a1%e3%81%ae%e3%82%a4%e3%83%99%e3%83%b3%e3%83%88/#:~:text=https%3A//tonamel.com/competition/qa7t3",
  },
  {
    id: 2,
    name: "ポケックス杯",
    tag: "オンライン",
    date: "2025年9月18日 22:00",
    benefits: "なし",
    detailUrl: "https://tonamel.com/competition/k52Q0",
  },
  {
    id: 3,
    name: "第4回ポケポケ杯",
    tag: "オンライン",
    date: "開催日 2025年9月20日 20:00",
    benefits: "なし",
    detailUrl: "https://e-spogate.net/%e7%ac%ac4%e5%9b%9e%e3%83%9d%e3%82%b1%e3%83%9d%e3%82%b1%e6%9d%af-3/#:~:text=https%3A//tonamel.com/competition/rJCrO",
  },
  {
    id: 4,
    name: "Shichiyu杯#4-サポート制限ルール",
    tag: "オンライン",
    date: "2025年9月20日 22:00",
    benefits: "なし",
    detailUrl: "https://e-spogate.net/shichiyu%e6%9d%af4-%e3%82%b5%e3%83%9d%e3%83%bc%e3%83%88%e5%88%b6%e9%99%90%e3%83%ab%e3%83%bc%e3%83%ab/#:~:text=https%3A//tonamel.com/competition/k3OwM",
  },
]

const getTagColor = (tag: string) => {
  switch (tag) {
    case "公式大会":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "地方大会":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "オンライン":
      return "bg-green-100 text-green-800 border-green-200"
    case "特別大会":
      return "bg-pink-100 text-pink-800 border-pink-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function TournamentCalendar() {
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
            {sampleTournaments.map((tournament) => (
              <tr key={tournament.id} className="hover:bg-slate-50 transition-colors duration-150">
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className="font-medium text-slate-900 text-sm">{tournament.name}</div>
                    <Badge className={`text-xs ${getTagColor(tournament.tag)}`}>{tournament.tag}</Badge>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs text-slate-900">{tournament.date}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs text-slate-900">{tournament.benefits}</div>
                </td>
                <td className="px-4 py-4">
                  <a
                    href={tournament.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors duration-150"
                    title="詳細を見る"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
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
