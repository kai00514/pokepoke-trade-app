"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GripVertical, Trash2, Copy, Eye, EyeOff } from "lucide-react"
import type { ArticleBlock } from "@/lib/actions/admin-articles"

// Block editors
import { HeadingBlockEditor } from "./blocks/heading-block-editor"
import { ParagraphBlockEditor } from "./blocks/paragraph-block-editor"
import { ImageBlockEditor } from "./blocks/image-block-editor"
import { ListBlockEditor } from "./blocks/list-block-editor"
import { TableBlockEditor } from "./blocks/table-block-editor"
import { CalloutBlockEditor } from "./blocks/callout-block-editor"
import { CardsTableBlockEditor } from "./blocks/cards-table-block-editor"
import { PickupBlockEditor } from "./blocks/pickup-block-editor"
import { ButtonBlockEditor } from "./blocks/button-block-editor"
import { CardDisplayTableBlockEditor } from "./blocks/card-display-table-block-editor"
import { FlexibleTableBlockEditor } from "./blocks/flexible-table-block-editor"
import { RichTextBlockEditor } from "./blocks/rich-text-block-editor"
import { MediaGalleryBlockEditor } from "./blocks/media-gallery-block-editor"
import { KeyValueTableBlockEditor } from "./blocks/key-value-table-block-editor"

interface BlockEditorProps {
  blocks: ArticleBlock[]
  onChange: (blocks: ArticleBlock[]) => void
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set())

  const handleDragEnd = (result: any) => {
    setDraggedIndex(null)

    if (!result.destination) return

    const items = Array.from(blocks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update display_order property to ensure uniqueness
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: (index + 1) * 10, // 10, 20, 30, ... の順序で設定
    }))

    onChange(updatedItems)
  }

  const handleBlockChange = (blockId: string, data: any) => {
    const updatedBlocks = blocks.map((block) => (block.id === blockId ? { ...block, data } : block))
    onChange(updatedBlocks)
  }

  const handleBlockDelete = (blockId: string) => {
    const updatedBlocks = blocks.filter((block) => block.id !== blockId)
    // 削除後に順序を再設定
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      display_order: (index + 1) * 10,
    }))
    onChange(reorderedBlocks)
  }

  const handleBlockDuplicate = (blockId: string) => {
    const blockToDuplicate = blocks.find((block) => block.id === blockId)
    if (!blockToDuplicate) return

    const newBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    const updatedBlocks = [...blocks]
    const insertIndex = blocks.findIndex((block) => block.id === blockId) + 1
    updatedBlocks.splice(insertIndex, 0, newBlock)

    // 全ブロックの順序を再設定してユニークにする
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      display_order: (index + 1) * 10,
    }))

    onChange(reorderedBlocks)
  }

  const toggleBlockCollapse = (blockId: string) => {
    const newCollapsed = new Set(collapsedBlocks)
    if (newCollapsed.has(blockId)) {
      newCollapsed.delete(blockId)
    } else {
      newCollapsed.add(blockId)
    }
    setCollapsedBlocks(newCollapsed)
  }

  const getBlockTitle = (block: ArticleBlock) => {
    if (!block || !block.type) return "不明なブロック"

    switch (block.type) {
      case "heading":
        return `見出し${block.data?.level || ""}: ${block.data?.text?.substring(0, 30) || "未設定"}...`
      case "paragraph":
        return `段落: ${block.data?.text?.substring(0, 30) || "未設定"}...`
      case "rich-text":
        return `リッチテキスト: ${block.data?.content?.substring(0, 30) || "未設定"}...`
      case "image":
        return `画像: ${block.data?.alt || block.data?.caption || "未設定"}`
      case "table":
        return `基本テーブル (${block.data?.headers?.length || 0}列)`
      case "flexible-table":
        return `柔軟テーブル (${block.data?.columns?.length || 0}列)`
      case "key-value-table":
        return `キー・バリューテーブル (${block.data?.rows?.length || 0}行)`
      case "cards-table":
        return `カードテーブル (${block.data?.items?.length || 0}項目)`
      case "card-display-table":
        return `カード表示テーブル (${block.data?.rows?.length || 0}行)`
      case "media-gallery":
        return `メディアギャラリー (${block.data?.items?.length || 0}項目)`
      case "callout":
        return `コールアウト: ${block.data?.title || block.data?.body?.substring(0, 30) || "未設定"}...`
      case "list":
        return `リスト (${block.data?.items?.length || 0}項目)`
      case "toc":
        return "目次"
      case "divider":
        return "区切り線"
      case "related-links":
        return "関連リンク"
      case "evaluation":
        return "評価"
      case "pickup":
        return "ピックアップ"
      case "button":
        return "ボタン"
      default:
        return `${block.type}: 未対応`
    }
  }

  const renderBlockEditor = (block: ArticleBlock) => {
    if (!block || !block.type) {
      return <div className="p-4 text-red-500">エラー: ブロックデータが不正です</div>
    }

    const commonProps = {
      data: block.data || {},
      onChange: (data: any) => handleBlockChange(block.id, data),
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
      case "flexible-table":
        return <FlexibleTableBlockEditor {...commonProps} />
      case "key-value-table":
        return <KeyValueTableBlockEditor {...commonProps} />
      case "callout":
        return <CalloutBlockEditor {...commonProps} />
      case "cards-table":
        return <CardsTableBlockEditor {...commonProps} />
      case "card-display-table":
        return <CardDisplayTableBlockEditor {...commonProps} />
      case "media-gallery":
        return <MediaGalleryBlockEditor {...commonProps} />
      case "pickup":
        return <PickupBlockEditor {...commonProps} />
      case "button":
        return <ButtonBlockEditor {...commonProps} />
      case "toc":
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="font-medium text-blue-900">目次</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">記事の見出しから自動生成されます</p>
          </div>
        )
      case "divider":
        return (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-500 rounded"></div>
              <span className="font-medium text-slate-900">区切り線</span>
            </div>
            <hr className="mt-2 border-slate-300" />
          </div>
        )
      case "related-links":
        return (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="font-medium text-green-900">関連リンク</span>
            </div>
            <p className="text-sm text-green-700 mt-1">関連記事へのリンクを表示します</p>
          </div>
        )
      case "evaluation":
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="font-medium text-yellow-900">評価</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">デッキの評価情報を表示します</p>
          </div>
        )
      default:
        return <div className="p-4 text-gray-500">未対応のブロックタイプ: {block.type}</div>
    }
  }

  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>ブロックが追加されていません</p>
        <p className="text-sm">「ブロックを追加」ボタンからコンテンツを追加してください</p>
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="blocks">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
            {blocks.map((block, index) => {
              // ブロックが存在しない場合はスキップ
              if (!block || !block.id) {
                console.warn(`Block at index ${index} is invalid:`, block)
                return null
              }

              return (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${snapshot.isDragging ? "shadow-lg" : ""} transition-shadow border-l-4 ${
                        collapsedBlocks.has(block.id) ? "border-l-slate-300" : "border-l-blue-500"
                      }`}
                    >
                      <CardContent className="p-0">
                        {/* ブロックヘッダー */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                                {block.type}
                              </span>
                              <span className="text-sm font-medium text-slate-700 truncate max-w-xs">
                                {getBlockTitle(block)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBlockCollapse(block.id)}
                              className="h-7 w-7 p-0"
                              title={collapsedBlocks.has(block.id) ? "展開" : "折りたたみ"}
                            >
                              {collapsedBlocks.has(block.id) ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBlockDuplicate(block.id)}
                              className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              title="複製"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBlockDelete(block.id)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="削除"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* ブロックコンテンツ */}
                        {!collapsedBlocks.has(block.id) && <div className="p-4">{renderBlockEditor(block)}</div>}
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
