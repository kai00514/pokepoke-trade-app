"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, GripVertical } from "lucide-react"
import { HeadingBlockEditor } from "./blocks/heading-block-editor"
import { ParagraphBlockEditor } from "./blocks/paragraph-block-editor"
import { ImageBlockEditor } from "./blocks/image-block-editor"
import { ListBlockEditor } from "./blocks/list-block-editor"
import { TableBlockEditor } from "./blocks/table-block-editor"
import { CalloutBlockEditor } from "./blocks/callout-block-editor"
import { CardsTableBlockEditor } from "./blocks/cards-table-block-editor"
import { CardDisplayTableBlockEditor } from "./blocks/card-display-table-block-editor"
import { PickupBlockEditor } from "./blocks/pickup-block-editor"
import { ButtonBlockEditor } from "./blocks/button-block-editor"
import { RichTextBlockEditor } from "./blocks/rich-text-block-editor"
import { BlockTypeSelector } from "./block-type-selector"

export interface Block {
  id: string
  type: string
  data: any
  display_order: number
}

interface BlockEditorProps {
  blocks: Block[]
  onChange: (blocks: Block[]) => void
}

export function BlockEditor({ blocks = [], onChange }: BlockEditorProps) {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)

  const addBlock = (type: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data: getDefaultBlockData(type),
      display_order: (blocks.length + 1) * 10,
    }
    onChange([...blocks, newBlock])
  }

  const updateBlock = (id: string, data: any) => {
    const updatedBlocks = blocks.map((block) => (block.id === id ? { ...block, data } : block))
    onChange(updatedBlocks)
  }

  const deleteBlock = (id: string) => {
    const filteredBlocks = blocks.filter((block) => block.id !== id)
    onChange(filteredBlocks)
  }

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks]
    const [movedBlock] = newBlocks.splice(fromIndex, 1)
    newBlocks.splice(toIndex, 0, movedBlock)

    // display_orderを再計算
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      display_order: (index + 1) * 10,
    }))

    onChange(reorderedBlocks)
  }

  const handleDragStart = (e: React.DragEvent, blockId: string, index: number) => {
    setDraggedBlock(blockId)
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
    if (dragIndex !== dropIndex) {
      moveBlock(dragIndex, dropIndex)
    }
    setDraggedBlock(null)
  }

  const renderBlockEditor = (block: Block) => {
    const commonProps = {
      data: block.data || {},
      onChange: (data: any) => updateBlock(block.id, data),
    }

    switch (block.type) {
      case "heading":
        return <HeadingBlockEditor {...commonProps} />
      case "paragraph":
        return <ParagraphBlockEditor {...commonProps} />
      case "rich-text":
        return <RichTextBlockEditor {...commonProps} />
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
      case "pickup":
        return <PickupBlockEditor {...commonProps} />
      case "button":
        return <ButtonBlockEditor {...commonProps} />
      default:
        return <div className="text-red-500">未対応のブロックタイプ: {block.type}</div>
    }
  }

  const getBlockTitle = (block: Block) => {
    switch (block.type) {
      case "heading":
        return `見出し${block.data?.level || 1}: ${block.data?.text || "未設定"}`
      case "paragraph":
        return `段落: ${(block.data?.text || "").substring(0, 30)}${(block.data?.text || "").length > 30 ? "..." : ""}`
      case "rich-text":
        return `リッチテキスト: ${(block.data?.content || "").substring(0, 30)}${(block.data?.content || "").length > 30 ? "..." : ""}`
      case "image":
        return `画像: ${block.data?.alt || "未設定"}`
      case "list":
        return `リスト (${block.data?.style || "bulleted"}): ${(block.data?.items || []).length}項目`
      case "table":
        return `テーブル: ${(block.data?.rows || []).length}行`
      case "callout":
        return `コールアウト (${block.data?.tone || "info"}): ${(block.data?.text || "").substring(0, 30)}${(block.data?.text || "").length > 30 ? "..." : ""}`
      case "cards-table":
        return `カードテーブル: ${(block.data?.items || []).length}枚`
      case "card-display-table":
        return `カード表示テーブル: ${(block.data?.rows || []).length}行`
      case "pickup":
        return `ピックアップ: ${block.data?.title || "未設定"} (${(block.data?.items || []).length}項目)`
      case "button":
        return `ボタン: ${block.data?.label || "未設定"}`
      default:
        return `不明なブロック: ${block.type}`
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ブロック</h3>
        <BlockTypeSelector onSelect={addBlock} />
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>ブロックがありません</p>
          <p className="text-sm">上の「ブロックを追加」ボタンからブロックを追加してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <Card
              key={block.id}
              className={`transition-all duration-200 ${draggedBlock === block.id ? "opacity-50" : ""}`}
              draggable
              onDragStart={(e) => handleDragStart(e, block.id, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    <CardTitle className="text-sm font-medium">{getBlockTitle(block)}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBlock(block.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>{renderBlockEditor(block)}</CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function getDefaultBlockData(type: string): any {
  switch (type) {
    case "heading":
      return { level: 2, text: "" }
    case "paragraph":
      return { text: "" }
    case "rich-text":
      return { content: "", format: "markdown", style: {} }
    case "image":
      return { url: "", alt: "", caption: "" }
    case "list":
      return { style: "bulleted", items: [""] }
    case "table":
      return { headers: [""], rows: [[""], [""]] }
    case "callout":
      return { tone: "info", text: "", title: "" }
    case "cards-table":
      return { items: [], headers: { card: "カード", quantity: "枚数" } }
    case "card-display-table":
      return { rows: [] }
    case "pickup":
      return { title: "", items: [] }
    case "button":
      return { label: "", href: "" }
    default:
      return {}
  }
}
