"use client"

import type React from "react"
import type { Block } from "../types"
import { TextBlockEditor } from "./blocks/text-block-editor"
import { ImageBlockEditor } from "./blocks/image-block-editor"
import { TocBlockEditor } from "./blocks/toc-block-editor"

interface BlockEditorProps {
  blocks: Block[]
  updateBlock: (id: string, data: any) => void
  deleteBlock: (id: string) => void
}

const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, updateBlock, deleteBlock }) => {
  return (
    <div>
      {blocks.map((block) => {
        switch (block.type) {
          case "text":
            return (
              <TextBlockEditor
                key={block.id}
                data={block.data}
                onChange={(data) => updateBlock(block.id, data)}
                onDelete={() => deleteBlock(block.id)}
              />
            )
          case "image":
            return (
              <ImageBlockEditor
                key={block.id}
                data={block.data}
                onChange={(data) => updateBlock(block.id, data)}
                onDelete={() => deleteBlock(block.id)}
              />
            )
          case "toc":
            return (
              <TocBlockEditor
                key={block.id}
                data={block.data}
                onChange={(data) => updateBlock(block.id, data)}
                onDelete={() => deleteBlock(block.id)}
              />
            )
          default:
            return null
        }
      })}
    </div>
  )
}

export default BlockEditor
