"use client"

import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

// サンプルデータ（後でデータベースから取得）
const sampleTournaments = [
  {
    id: 1,
    name: "ポケモンカード大会大会 東京予選",
    tag: "公式大会",
    date: "2025年8月30日",
    benefits: "限定プロモカード",
    detailUrl: "https://example.com/tournament/1",
  },
  {
    id: 2,
    name: "新春杯トーナメント",
    tag: "地方大会",
    date: "2024年1月20日",
    benefits: "優勝賞金5万円",
    detailUrl: "https://example.com/tournament/2",
  },
  {
    id: 3,
    name: "オンライン大会 冬の陣",
    tag: "オンライン",
    date: "2024年1月22日",
    benefits: "デジタル限定カード",
    detailUrl: "https://example.com/tournament/3",
  },
  {
    id: 4,
    name: "チャンピオンズリーグ予選",
    tag: "公式大会",
    date: "2024年1月28日",
    benefits: "世界大会出場権",
    detailUrl: "https://example.com/tournament/4",
  },
  {
    id: 5,
    name: "学生限定オンライン大会",
    tag: "特別大会",
    date: "2024年2月3日",
    benefits: "図書カード1万円分",
    detailUrl: "https://example.com/tournament/5",
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
