"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GripVertical, Trash2 } from "lucide-react"
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

interface BlockEditorProps {
  blocks: ArticleBlock[]
  onChange: (blocks: ArticleBlock[]) => void
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

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

  const renderBlockEditor = (block: ArticleBlock) => {
    switch (block.type) {
      case "heading":
        return <HeadingBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "paragraph":
        return <ParagraphBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "image":
        return <ImageBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "list":
        return <ListBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "table":
        return <TableBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "callout":
        return <CalloutBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
      case "cards-table":
        return <CardsTableBlockEditor data={block.data} onChange={(data) => handleBlockChange(block.id, data)} />
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
                    className={`${snapshot.isDragging ? "shadow-lg" : ""} transition-shadow`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div {...provided.dragHandleProps} className="flex flex-col items-center space-y-2 pt-2">
                          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBlockDelete(block.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">{renderBlockEditor(block)}</div>
                      </div>
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
