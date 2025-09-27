"use client"
import { ParagraphBlockEditor } from "./blocks/paragraph-block-editor"
import { HeadingBlockEditor } from "./blocks/heading-block-editor"
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
import type { Block } from "@/lib/actions/info-articles"

interface BlockEditorProps {
  block: Block
  onChange: (block: Block) => void
  onDelete: () => void
}

export function BlockEditor({ block, onChange, onDelete }: BlockEditorProps) {
  const handleDataChange = (newData: any) => {
    onChange({ ...block, data: newData })
  }

  switch (block.type) {
    case "paragraph":
      return <ParagraphBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "heading":
      return <HeadingBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "image":
      return <ImageBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "list":
      return <ListBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "table":
      return <TableBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "callout":
      return <CalloutBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "cards-table":
      return <CardsTableBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "pickup":
      return <PickupBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "button":
      return <ButtonBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "card-display-table":
      return <CardDisplayTableBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "flexible-table":
      return <FlexibleTableBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "rich-text":
      return <RichTextBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    case "media-gallery":
      return <MediaGalleryBlockEditor data={block.data} onChange={handleDataChange} onDelete={onDelete} />

    // 特殊ブロック（データなし）
    case "toc":
      return (
        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">目次</h3>
              <p className="text-sm text-blue-700">記事の見出しから自動生成されます</p>
            </div>
            <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm">
              削除
            </button>
          </div>
        </div>
      )

    case "divider":
      return (
        <div className="p-4 border rounded-lg bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900">区切り線</h3>
              <hr className="mt-2 border-slate-300" />
            </div>
            <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm">
              削除
            </button>
          </div>
        </div>
      )

    case "related-links":
      return (
        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-900">関連リンク</h3>
              <p className="text-sm text-green-700">関連記事へのリンクを表示します</p>
            </div>
            <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm">
              削除
            </button>
          </div>
        </div>
      )

    case "evaluation":
      return (
        <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-yellow-900">評価</h3>
              <p className="text-sm text-yellow-700">デッキの評価情報を表示します</p>
            </div>
            <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm">
              削除
            </button>
          </div>
        </div>
      )

    default:
      return (
        <div className="p-4 border rounded-lg bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-900">未対応ブロック</h3>
              <p className="text-sm text-red-700">ブロックタイプ: {block.type}</p>
            </div>
            <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm">
              削除
            </button>
          </div>
        </div>
      )
  }
}
