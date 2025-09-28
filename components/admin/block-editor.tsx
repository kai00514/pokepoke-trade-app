"use client"

import type React from "react"
import type { Block } from "../types"
import { KeyValueTableBlockEditor } from "./blocks/key-value-table-block-editor"

interface BlockEditorProps {
  block: Block
  onBlockChange: (id: string, data: any) => void
}

const BlockEditor: React.FC<BlockEditorProps> = ({ block, onBlockChange }) => {
  switch (block.type) {
    case "key-value-table":
      return (
        <KeyValueTableBlockEditor key={block.id} data={block.data} onChange={(data) => onBlockChange(block.id, data)} />
      )
    // ** rest of code here **
    default:
      return <div>Unknown block type</div>
  }
}

export default BlockEditor
