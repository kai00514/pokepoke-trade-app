"use client"

import type React from "react"
import type { Block } from "./types"
import { updateBlock } from "./utils"
import { KeyValueTableBlockEditor } from "./blocks/key-value-table-block-editor"

interface BlockEditorProps {
  block: Block
}

const BlockEditor: React.FC<BlockEditorProps> = ({ block }) => {
  const renderBlockEditor = () => {
    switch (block.type) {
      case "key-value-table":
        return (
          <KeyValueTableBlockEditor
            data={block.data || { rows: [] }}
            onChange={(data) => updateBlock(block.id, { ...block, data })}
          />
        )
      // ** rest of code here **
      default:
        return <div>Unknown block type</div>
    }
  }

  return <div>{renderBlockEditor()}</div>
}

export default BlockEditor
