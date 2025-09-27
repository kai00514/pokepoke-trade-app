"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus } from "lucide-react"

interface BlockTypeSelectorProps {
  onSelect: (type: string) => void
}

const blockTypes = [
  {
    category: "基本コンテンツ",
    items: [
      { type: "heading", label: "見出し", description: "H1, H2, H3の見出し" },
      { type: "paragraph", label: "段落", description: "通常のテキスト段落" },
      { type: "rich-text", label: "リッチテキスト", description: "Markdown/HTML対応テキスト" },
    ],
  },
  {
    category: "メディア",
    items: [
      { type: "image", label: "画像", description: "単一画像の表示" },
      { type: "media-gallery", label: "メディアギャラリー", description: "複数画像のギャラリー" },
    ],
  },
  {
    category: "リスト・テーブル",
    items: [
      { type: "list", label: "リスト", description: "箇条書き・番号付きリスト" },
      { type: "table", label: "テーブル", description: "基本的な表" },
      { type: "flexible-table", label: "柔軟テーブル", description: "高機能な表" },
    ],
  },
  {
    category: "ポケモンカード専用",
    items: [
      { type: "cards-table", label: "カードテーブル", description: "カード情報の表" },
      { type: "card-display-table", label: "カード表示テーブル", description: "カード画像表示テーブル" },
      { type: "evaluation", label: "評価", description: "デッキ評価情報" },
    ],
  },
  {
    category: "インタラクティブ",
    items: [
      { type: "button", label: "ボタン", description: "CTAボタン" },
      { type: "callout", label: "コールアウト", description: "注意・警告・情報ボックス" },
      { type: "pickup", label: "ピックアップ", description: "重要情報の強調表示" },
    ],
  },
  {
    category: "ナビゲーション",
    items: [
      { type: "toc", label: "目次", description: "記事の目次" },
      { type: "related-links", label: "関連リンク", description: "関連記事へのリンク" },
      { type: "divider", label: "区切り線", description: "セクション区切り" },
    ],
  },
]

export function BlockTypeSelector({ onSelect }: BlockTypeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          ブロックを追加
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80"
        style={{
          maxHeight: "min(400px, calc(100vh - 100px))",
          overflowY: "auto",
        }}
      >
        {blockTypes.map((category, categoryIndex) => (
          <div key={category.category}>
            <DropdownMenuLabel className="sticky top-0 bg-white z-10 border-b">{category.category}</DropdownMenuLabel>
            {category.items.map((item) => (
              <DropdownMenuItem
                key={item.type}
                onClick={() => onSelect(item.type)}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-slate-50"
              >
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-slate-500 mt-1">{item.description}</div>
              </DropdownMenuItem>
            ))}
            {categoryIndex < blockTypes.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
