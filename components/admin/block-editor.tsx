"use client"

import { ParagraphBlockEditor } from "./blocks/paragraph-block-editor"
import { HeadingBlockEditor } from "./blocks/heading-block-editor"
import { ImageBlockEditor } from "./blocks/image-block-editor"
import { ListBlockEditor } from "./blocks/list-block-editor"
import { TableBlockEditor } from "./blocks/table-block-editor"
import { CalloutBlockEditor } from "./blocks/callout-block-editor"
import { PickupBlockEditor } from "./blocks/pickup-block-editor"
import { ButtonBlockEditor } from "./blocks/button-block-editor"
import { CardsTableBlockEditor } from "./blocks/cards-table-block-editor"
import { KeyValueTableBlockEditor } from "./blocks/key-value-table-block-editor"
import { FlexibleTableBlockEditor } from "./blocks/flexible-table-block-editor"
import { MediaGalleryBlockEditor } from "./blocks/media-gallery-block-editor"
import { RichTextBlockEditor } from "./blocks/rich-text-block-editor"
import { CardDisplayTableBlockEditor } from "./blocks/card-display-table-block-editor"
import { TocBlockEditor } from "./blocks/toc-block-editor"
import { LatestInfoBlockEditor } from "./blocks/latest-info-block-editor"
import type { Block } from "@/lib/actions/info-articles"

interface BlockEditorProps {
  block: Block
  onChange: (block: Block) => void
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  const handleDataChange = (newData: any) => {
    onChange({
      ...block,
      data: newData,
    })
  }

  switch (block.type) {
    case "paragraph":
      return <ParagraphBlockEditor data={block.data} onChange={handleDataChange} />

    case "heading":
      return <HeadingBlockEditor data={block.data} onChange={handleDataChange} />

    case "image":
      return <ImageBlockEditor data={block.data} onChange={handleDataChange} />

    case "list":
      return <ListBlockEditor data={block.data} onChange={handleDataChange} />

    case "table":
      return <TableBlockEditor data={block.data} onChange={handleDataChange} />

    case "callout":
      return <CalloutBlockEditor data={block.data} onChange={handleDataChange} />

    case "pickup":
      return <PickupBlockEditor data={block.data} onChange={handleDataChange} />

    case "button":
      return <ButtonBlockEditor data={block.data} onChange={handleDataChange} />

    case "cards-table":
      return <CardsTableBlockEditor data={block.data} onChange={handleDataChange} />

    case "key-value-table":
      return <KeyValueTableBlockEditor data={block.data} onChange={handleDataChange} />

    case "flexible-table":
      return <FlexibleTableBlockEditor data={block.data} onChange={handleDataChange} />

    case "media-gallery":
      return <MediaGalleryBlockEditor data={block.data} onChange={handleDataChange} />

    case "rich-text":
      return <RichTextBlockEditor data={block.data} onChange={handleDataChange} />

    case "card-display-table":
      return <CardDisplayTableBlockEditor data={block.data} onChange={handleDataChange} />

    case "toc":
      return <TocBlockEditor data={block.data} onChange={handleDataChange} />

    case "latest-info":
      return <LatestInfoBlockEditor data={block.data} onChange={handleDataChange} />

    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 font-medium">未対応のブロックタイプ: {(block as any).type}</p>
          <pre className="mt-2 text-xs text-yellow-700 overflow-auto">
            {JSON.stringify((block as any).data, null, 2)}
          </pre>
        </div>
      )
  }
}
