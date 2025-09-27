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

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }))

    onChange(updatedItems)
  }

  const handleBlockChange = (blockId: string, data: any) => {
    const updatedBlocks = blocks.map((block) => (block.id === blockId ? { ...block, data } : block))
    onChange(updatedBlocks)
  }

  const handleBlockDelete = (blockId: string) => {
    const updatedBlocks = blocks.filter((block) => block.id !== blockId)
    onChange(updatedBlocks)
  }

  const handleBlockDuplicate = (blockId: string) => {
    const blockToDuplicate = blocks.find((block) => block.id === blockId)
    if (!blockToDuplicate) return

    const newBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: blockToDuplicate.order + 1,
    }

    const updatedBlocks = [...blocks]
    const insertIndex = blocks.findIndex((block) => block.id === blockId) + 1
    updatedBlocks.splice(insertIndex, 0, newBlock)

    // Update order for subsequent blocks
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      order: index,
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
    switch (block.type) {
      case "heading":
        return `見出し${block.data.level}: ${block.data.text || "未設定"}`
      case "paragraph":
        return `段落: ${block.data.text?.substring(0, 30) || "未設定"}...`
      case "rich-text":
        return `リッチテキスト: ${block.data.content?.substring(0, 30) || "未設定"}...`
      case "image":
        return `画像: ${block.data.alt || block.data.caption || "未設定"}`
      case "table":
        return `基本テーブル (${block.data.headers?.length || 0}列)`
      case "flexible-table":
        return `柔軟テーブル (${block.data.columns?.length || 0}列)`
      case "cards-table":
        return `カードテーブル (${block.data.items?.length || 0}項目)`
      case "card-display-table":
        return `カード表示テーブル (${block.data.rows?.length || 0}行)`
      case "media-gallery":
        return `メディアギャラリー (${block.data.items?.length || 0}項目)`
      case "callout":
        return `コールアウト: ${block.data.title || block.data.body?.substring(0, 30) || "未設定"}...`
      case "list":
        return `リスト (${block.data.items?.length || 0}項目)`
      default:
        return `${block.type}: 未対応`
    }
  }

  const renderBlockEditor = (block: ArticleBlock) => {
    switch (block.type) {
      case "heading":
        return <HeadingBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "paragraph":
        return <ParagraphBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "rich-text":
        return <RichTextBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "image":
        return <ImageBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "list":
        return <ListBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "table":
        return <TableBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "flexible-table":
        return <FlexibleTableBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "callout":
        return <CalloutBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "cards-table":
        return <CardsTableBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "card-display-table":
        return <CardDisplayTableBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "media-gallery":
        return <MediaGalleryBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "pickup":
        return <PickupBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "button":
        return <ButtonBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      default:
        return <div className="p-4 text-gray-500">未対応のブロックタイプ: {block.type}</div>
    }
  }

  if (blocks.length === 0) {
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
            {blocks.map((block, index) => (
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
                            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">{block.type}</span>
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
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
