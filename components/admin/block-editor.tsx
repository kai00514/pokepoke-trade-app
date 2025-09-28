"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react"
import { HeadingBlockEditor } from "./blocks/heading-block-editor"
import { ParagraphBlockEditor } from "./blocks/paragraph-block-editor"
import { ImageBlockEditor } from "./blocks/image-block-editor"
import { ListBlockEditor } from "./blocks/list-block-editor"
import { TableBlockEditor } from "./blocks/table-block-editor"
import { CalloutBlockEditor } from "./blocks/callout-block-editor"
import { CardsTableBlockEditor } from "./blocks/cards-table-block-editor"
import { CardDisplayTableBlockEditor } from "./blocks/card-display-table-block-editor"
import { KeyValueTableBlockEditor } from "./blocks/key-value-table-block-editor"
import { FlexibleTableBlockEditor } from "./blocks/flexible-table-block-editor"
import { MediaGalleryBlockEditor } from "./blocks/media-gallery-block-editor"
import { RichTextBlockEditor } from "./blocks/rich-text-block-editor"
import { PickupBlockEditor } from "./blocks/pickup-block-editor"
import { ButtonBlockEditor } from "./blocks/button-block-editor"
import { TocBlockEditor } from "./blocks/toc-block-editor"
import { LatestInfoBlockEditor } from "./blocks/latest-info-block-editor"

export interface ArticleBlock {
  id: string
  type: string
  data: any
  display_order: number
}

interface BlockEditorProps {
  blocks: ArticleBlock[]
  onChange: (blocks: ArticleBlock[]) => void
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())

  const toggleExpanded = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks)
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId)
    } else {
      newExpanded.add(blockId)
    }
    setExpandedBlocks(newExpanded)
  }

  const updateBlock = (blockId: string, newData: any) => {
    const updatedBlocks = blocks.map((block) => (block.id === blockId ? { ...block, data: newData } : block))
    onChange(updatedBlocks)
  }

  const removeBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter((block) => block.id !== blockId)
    onChange(updatedBlocks)
  }

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const currentIndex = blocks.findIndex((block) => block.id === blockId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= blocks.length) return

    const newBlocks = [...blocks]
    const [movedBlock] = newBlocks.splice(currentIndex, 1)
    newBlocks.splice(newIndex, 0, movedBlock)

    // Update display_order
    const updatedBlocks = newBlocks.map((block, index) => ({
      ...block,
      display_order: (index + 1) * 10,
    }))

    onChange(updatedBlocks)
  }

  const renderBlockEditor = (block: ArticleBlock) => {
    const commonProps = {
      data: block.data,
      onChange: (newData: any) => updateBlock(block.id, newData),
    }

    switch (block.type) {
      case "heading":
        return <HeadingBlockEditor {...commonProps} />
      case "paragraph":
        return <ParagraphBlockEditor {...commonProps} />
      case "image":
        return <ImageBlockEditor {...commonProps} />
      case "list":
        return <ListBlockEditor {...commonProps} />
      case "table":
        return <TableBlockEditor {...commonProps} />
      case "callout":
        return <CalloutBlockEditor {...commonProps} />
      case "cards-table":
        return <CardsTableBlockEditor {...commonProps} />
      case "card-display-table":
        return <CardDisplayTableBlockEditor {...commonProps} />
      case "key-value-table":
        return <KeyValueTableBlockEditor {...commonProps} />
      case "flexible-table":
        return <FlexibleTableBlockEditor {...commonProps} />
      case "media-gallery":
        return <MediaGalleryBlockEditor {...commonProps} />
      case "rich-text":
        return <RichTextBlockEditor {...commonProps} />
      case "pickup":
        return <PickupBlockEditor {...commonProps} />
      case "button":
        return <ButtonBlockEditor {...commonProps} />
      case "toc":
        return <TocBlockEditor {...commonProps} />
      case "latest-info":
        return <LatestInfoBlockEditor {...commonProps} />
      case "divider":
        return (
          <Card>
            <CardContent className="p-4">
              <div className="text-center text-slate-500">
                <hr className="border-t-2 border-blue-200" />
                <p className="text-sm mt-2">区切り線</p>
              </div>
            </CardContent>
          </Card>
        )
      default:
        return (
          <Card>
            <CardContent className="p-4">
              <p className="text-red-600">未対応のブロックタイプ: {block.type}</p>
            </CardContent>
          </Card>
        )
    }
  }

  const getBlockTitle = (block: ArticleBlock) => {
    switch (block.type) {
      case "heading":
        return `見出し${block.data.level || 1}: ${block.data.text || "未設定"}`
      case "paragraph":
        return `段落: ${block.data.text?.substring(0, 30) || "未設定"}${block.data.text?.length > 30 ? "..." : ""}`
      case "image":
        return `画像: ${block.data.alt || "未設定"}`
      case "list":
        return `リスト (${block.data.style === "numbered" ? "番号付き" : "箇条書き"})`
      case "table":
        return "テーブル"
      case "callout":
        return `コールアウト (${block.data.tone || "info"})`
      case "cards-table":
        return "カードテーブル"
      case "card-display-table":
        return "カード表示テーブル"
      case "key-value-table":
        return "キー・バリューテーブル"
      case "flexible-table":
        return "柔軟テーブル"
      case "media-gallery":
        return "メディアギャラリー"
      case "rich-text":
        return "リッチテキスト"
      case "pickup":
        return "ピックアップ"
      case "button":
        return `ボタン: ${block.data.label || "未設定"}`
      case "toc":
        return "目次"
      case "latest-info":
        return `最新情報: ${block.data.title || "未設定"}`
      case "divider":
        return "区切り線"
      default:
        return `未対応ブロック: ${block.type}`
    }
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-lg font-medium">コンテンツブロックがありません</p>
        <p className="text-sm mt-2">右上の「ブロックを追加」ボタンからコンテンツを追加してください</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const isExpanded = expandedBlocks.has(block.id)
        return (
          <div key={block.id} className="border border-slate-200 rounded-lg bg-white shadow-sm">
            {/* Block Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                <div>
                  <h3 className="font-medium text-slate-900">{getBlockTitle(block)}</h3>
                  <p className="text-xs text-slate-500">ブロック {index + 1}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveBlock(block.id, "up")}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveBlock(block.id, "down")}
                  disabled={index === blocks.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleExpanded(block.id)} className="h-8 px-3">
                  {isExpanded ? "折りたたむ" : "展開"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlock(block.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Block Content */}
            {isExpanded && <div className="p-4">{renderBlockEditor(block)}</div>}
          </div>
        )
      })}
    </div>
  )
}
