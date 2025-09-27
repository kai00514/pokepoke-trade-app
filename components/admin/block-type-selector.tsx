"use client"

import { useState } from "react"
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

export function BlockTypeSelector({ onSelect }: BlockTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

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
        { type: "flexible-table", label: "柔軟テーブル", description: "高度な表機能" },
      ],
    },
    {
      category: "ポケモンカード専用",
      items: [
        { type: "cards-table", label: "カードテーブル", description: "カード情報の表" },
        { type: "card-display-table", label: "カード表示テーブル", description: "カード画像の表示テーブル" },
        { type: "evaluation", label: "評価", description: "デッキ評価情報" },
      ],
    },
    {
      category: "インタラクティブ",
      items: [
        { type: "button", label: "ボタン", description: "CTA・リンクボタン" },
        { type: "callout", label: "コールアウト", description: "注意・情報ボックス" },
        { type: "pickup", label: "ピックアップ", description: "重要情報の強調表示" },
      ],
    },
    {
      category: "ナビゲーション",
      items: [
        { type: "toc", label: "目次", description: "記事の目次" },
        { type: "related-links", label: "関連リンク", description: "関連記事・外部リンク" },
        { type: "divider", label: "区切り線", description: "セクション区切り" },
      ],
    },
  ]

  const handleSelect = (type: string) => {
    onSelect(type)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          ブロックを追加
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
        {blockTypes.map((category, categoryIndex) => (
          <div key={category.category}>
            {categoryIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {category.category}
            </DropdownMenuLabel>
            {category.items.map((item) => {
              const Icon = item.icon
              return (
                <DropdownMenuItem
                  key={item.type}
                  onClick={() => handleSelect(item.type)}
                  className="flex items-start space-x-3 p-3 cursor-pointer hover:bg-gray-50"
                >
                  <Icon className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
