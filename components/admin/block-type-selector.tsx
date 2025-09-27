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
import {
  Plus,
  Type,
  ImageIcon,
  List,
  Table,
  AlertCircle,
  Minus,
  Link,
  Star,
  CreditCard,
  Heading,
  FileText,
  Grid3X3,
  Images,
  Table2,
  MousePointer,
  BarChart3,
  BookOpen,
  Layers,
  Hash,
  Quote,
  Code,
  Calendar,
  Users,
  Settings,
  Zap,
} from "lucide-react"

interface BlockTypeSelectorProps {
  onSelect: (type: string) => void
}

export function BlockTypeSelector({ onSelect }: BlockTypeSelectorProps) {
  const blockTypes = [
    {
      category: "基本コンテンツ",
      items: [
        { type: "heading", label: "見出し", icon: Heading, description: "セクションの見出し（H1-H6）" },
        { type: "paragraph", label: "段落", icon: Type, description: "通常のテキスト段落" },
        { type: "rich-text", label: "リッチテキスト", icon: FileText, description: "Markdown/HTML対応テキスト" },
        { type: "quote", label: "引用", icon: Quote, description: "引用文の表示" },
        { type: "code", label: "コードブロック", icon: Code, description: "プログラムコードの表示" },
        { type: "divider", label: "区切り線", icon: Minus, description: "セクションの区切り線" },
      ],
    },
    {
      category: "メディア",
      items: [
        { type: "image", label: "画像", icon: ImageIcon, description: "単一画像の表示" },
        { type: "media-gallery", label: "メディアギャラリー", icon: Images, description: "複数画像のギャラリー表示" },
        { type: "video", label: "動画", icon: Zap, description: "動画の埋め込み" },
        { type: "audio", label: "音声", icon: Settings, description: "音声ファイルの再生" },
      ],
    },
    {
      category: "リスト・テーブル",
      items: [
        { type: "list", label: "リスト", icon: List, description: "箇条書きや番号付きリスト" },
        { type: "table", label: "基本テーブル", icon: Table, description: "シンプルな表組み" },
        {
          type: "flexible-table",
          label: "柔軟テーブル",
          icon: Table2,
          description: "高機能なカスタマイズ可能テーブル",
        },
        { type: "comparison-table", label: "比較テーブル", icon: BarChart3, description: "商品やサービスの比較表" },
      ],
    },
    {
      category: "ポケモンカード専用",
      items: [
        { type: "cards-table", label: "カードテーブル", icon: CreditCard, description: "ポケモンカード情報の表示" },
        {
          type: "card-display-table",
          label: "カード表示テーブル",
          icon: Grid3X3,
          description: "ヘッダー付きカード一覧表示",
        },
        { type: "deck-list", label: "デッキリスト", icon: Layers, description: "デッキ構成の表示" },
        { type: "card-search", label: "カード検索", icon: Hash, description: "カード検索機能" },
        { type: "evaluation", label: "デッキ評価", icon: Star, description: "デッキの評価・レーティング" },
      ],
    },
    {
      category: "インタラクティブ",
      items: [
        { type: "button", label: "ボタン", icon: MousePointer, description: "アクションボタン" },
        { type: "callout", label: "コールアウト", icon: AlertCircle, description: "注意書きや重要な情報" },
        { type: "accordion", label: "アコーディオン", icon: BookOpen, description: "折りたたみ可能なコンテンツ" },
        { type: "tabs", label: "タブ", icon: Layers, description: "タブ切り替えコンテンツ" },
        { type: "modal", label: "モーダル", icon: Settings, description: "ポップアップ表示" },
      ],
    },
    {
      category: "ナビゲーション・リンク",
      items: [
        { type: "toc", label: "目次", icon: List, description: "記事の目次を自動生成" },
        { type: "related-links", label: "関連リンク", icon: Link, description: "関連ページへのリンク集" },
        { type: "breadcrumb", label: "パンくずリスト", icon: Link, description: "ナビゲーションパス" },
        { type: "pagination", label: "ページネーション", icon: Hash, description: "ページ送り機能" },
      ],
    },
    {
      category: "特殊コンテンツ",
      items: [
        { type: "pickup", label: "ピックアップ", icon: Star, description: "注目コンテンツの強調表示" },
        { type: "banner", label: "バナー", icon: ImageIcon, description: "宣伝・告知バナー" },
        { type: "timeline", label: "タイムライン", icon: Calendar, description: "時系列の表示" },
        { type: "testimonial", label: "お客様の声", icon: Users, description: "レビューや感想" },
        { type: "faq", label: "FAQ", icon: AlertCircle, description: "よくある質問" },
        { type: "contact-form", label: "お問い合わせフォーム", icon: Settings, description: "連絡フォーム" },
      ],
    },
    {
      category: "データ表示",
      items: [
        { type: "chart", label: "グラフ", icon: BarChart3, description: "データのグラフ表示" },
        { type: "progress", label: "プログレスバー", icon: BarChart3, description: "進捗の表示" },
        { type: "counter", label: "カウンター", icon: Hash, description: "数値カウンター" },
        { type: "stats", label: "統計情報", icon: BarChart3, description: "統計データの表示" },
      ],
    },
  ]

  const handleSelect = (type: string) => {
    console.log("=== DEBUG: BlockTypeSelector - handleSelect ===")
    console.log("Selected type:", type)
    console.log("onSelect function:", typeof onSelect)

    if (typeof onSelect === "function") {
      onSelect(type)
    } else {
      console.error("onSelect is not a function:", onSelect)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          ブロックを追加
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-96"
        align="start"
        side="bottom"
        sideOffset={4}
        style={{
          maxHeight: "min(400px, calc(100vh - 100px))",
          overflowY: "auto",
        }}
      >
        <div className="p-1">
          {blockTypes.map((category, categoryIndex) => (
            <div key={category.category}>
              {categoryIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-2 sticky top-0 bg-white z-10">
                {category.category}
              </DropdownMenuLabel>
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem
                      key={item.type}
                      onClick={() => handleSelect(item.type)}
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-md mx-1"
                    >
                      <Icon className="h-4 w-4 mt-0.5 text-slate-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
