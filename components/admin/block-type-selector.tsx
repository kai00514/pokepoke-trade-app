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
      { type: "heading", label: "見出し", description: "H1-H6の見出しテキスト" },
      { type: "paragraph", label: "段落", description: "通常のテキスト段落" },
      { type: "rich-text", label: "リッチテキスト", description: "Markdown/HTML対応テキスト" },
    ],
  },
  {
    category: "メディア",
    items: [
      { type: "image", label: "画像", description: "単一画像の表示" },
      { type: "media-gallery", label: "メディアギャラリー", description: "複数画像のギャラリー表示" },
    ],
  },
  {
    category: "リスト・テーブル",
    items: [
      { type: "list", label: "リスト", description: "箇条書きや番号付きリスト" },
      { type: "table", label: "テーブル", description: "基本的な表組み" },
      { type: "flexible-table", label: "柔軟テーブル", description: "カスタマイズ可能な表組み" },
    ],
  },
  {
    category: "ポケモンカード専用",
    items: [
      { type: "cards-table", label: "カードテーブル", description: "ポケモンカード一覧表" },
      { type: "card-display-table", label: "カード表示テーブル", description: "カード画像付き表示テーブル" },
    ],
  },
  {
    category: "インタラクティブ",
    items: [
      { type: "button", label: "ボタン", description: "クリック可能なボタン" },
      { type: "callout", label: "コールアウト", description: "注意書きや強調表示" },
    ],
  },
  {
    category: "ナビゲーション・リンク",
    items: [
      { type: "toc", label: "目次", description: "記事の目次を自動生成" },
      { type: "related-links", label: "関連リンク", description: "関連記事やリンク集" },
    ],
  },
  {
    category: "特殊コンテンツ",
    items: [
      { type: "pickup", label: "ピックアップ", description: "注目コンテンツの紹介" },
      { type: "evaluation", label: "評価", description: "デッキやカードの評価表示" },
      { type: "divider", label: "区切り線", description: "セクション間の区切り" },
    ],
  },
]

export function BlockTypeSelector({ onSelect }: BlockTypeSelectorProps) {
  const handleSelect = (type: string) => {
    console.log("=== DEBUG: BlockTypeSelector - handleSelect ===")
    console.log("Selected block type:", type)
    console.log("onSelect function:", typeof onSelect)

    try {
      onSelect(type)
      console.log("Block type selected successfully")
    } catch (error) {
      console.error("Error in onSelect:", error)
    }
  }

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
                onClick={() => handleSelect(item.type)}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-slate-50"
              >
                <div className="font-medium">{item.label}</div>
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
