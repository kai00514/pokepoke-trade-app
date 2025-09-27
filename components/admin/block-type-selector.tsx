"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Type,
  AlignLeft,
  ImageIcon,
  List,
  Table,
  AlertCircle,
  CreditCard,
  Link,
  Minus,
  ListOrdered,
  Star,
  FileText,
  Grid3X3,
  Images,
  Code,
} from "lucide-react"

interface BlockTypeSelectorProps {
  onSelect: (type: string) => void
}

const blockTypes = [
  {
    category: "基本",
    items: [
      { type: "heading", label: "見出し", icon: Type },
      { type: "paragraph", label: "段落", icon: AlignLeft },
      { type: "rich-text", label: "リッチテキスト", icon: FileText },
      { type: "image", label: "画像", icon: ImageIcon },
      { type: "divider", label: "区切り線", icon: Minus },
    ],
  },
  {
    category: "リスト・テーブル",
    items: [
      { type: "list", label: "リスト", icon: List },
      { type: "table", label: "基本テーブル", icon: Table },
      { type: "flexible-table", label: "柔軟テーブル", icon: Grid3X3 },
      { type: "cards-table", label: "カードテーブル", icon: CreditCard },
      { type: "card-display-table", label: "カード表示テーブル", icon: CreditCard },
    ],
  },
  {
    category: "メディア",
    items: [
      { type: "media-gallery", label: "メディアギャラリー", icon: Images },
      { type: "callout", label: "コールアウト", icon: AlertCircle },
    ],
  },
  {
    category: "特殊",
    items: [
      { type: "toc", label: "目次", icon: ListOrdered },
      { type: "evaluation", label: "評価", icon: Star },
      { type: "related-links", label: "関連リンク", icon: Link },
      { type: "pickup", label: "ピックアップ", icon: Star },
      { type: "button", label: "ボタン", icon: Code },
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
      <DropdownMenuContent align="end" className="w-56">
        {blockTypes.map((category, categoryIndex) => (
          <div key={category.category}>
            {categoryIndex > 0 && <DropdownMenuSeparator />}
            <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">{category.category}</div>
            {category.items.map((item) => (
              <DropdownMenuItem key={item.type} onClick={() => onSelect(item.type)}>
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
