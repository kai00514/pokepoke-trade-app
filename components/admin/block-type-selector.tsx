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
import { Plus, Type, FileText, ImageIcon, List, Table, AlertCircle, CreditCard, Star, MousePointer } from "lucide-react"

interface BlockTypeSelectorProps {
  onSelect: (type: string) => void
}

export function BlockTypeSelector({ onSelect }: BlockTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const blockTypes = [
    {
      category: "基本",
      items: [
        { type: "heading", label: "見出し", icon: Type, description: "H1, H2, H3の見出し" },
        { type: "paragraph", label: "段落", icon: FileText, description: "通常のテキスト段落" },
        { type: "rich-text", label: "リッチテキスト", icon: FileText, description: "Markdown/HTML対応テキスト" },
        { type: "image", label: "画像", icon: ImageIcon, description: "画像の挿入" },
      ],
    },
    {
      category: "構造",
      items: [
        { type: "list", label: "リスト", icon: List, description: "箇条書きまたは番号付きリスト" },
        { type: "table", label: "テーブル", icon: Table, description: "表形式のデータ" },
        { type: "callout", label: "コールアウト", icon: AlertCircle, description: "注意書きや強調表示" },
      ],
    },
    {
      category: "カード",
      items: [
        { type: "cards-table", label: "カードテーブル", icon: CreditCard, description: "カード一覧表" },
        {
          type: "card-display-table",
          label: "カード表示テーブル",
          icon: CreditCard,
          description: "カード画像表示テーブル",
        },
      ],
    },
    {
      category: "特殊",
      items: [
        { type: "pickup", label: "ピックアップ", icon: Star, description: "重要な情報の強調表示" },
        { type: "button", label: "ボタン", icon: MousePointer, description: "リンクボタン" },
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
