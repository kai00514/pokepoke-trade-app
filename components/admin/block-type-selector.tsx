import type React from "react"
import { Star } from "lucide-react"

const BlockTypeSelector: React.FC = () => {
  const blockTypes = [
    {
      type: "text",
      label: "テキスト",
      description: "シンプルなテキストブロック",
      icon: "TextIcon",
      category: "content",
    },
    {
      type: "image",
      label: "画像",
      description: "画像を表示するブロック",
      icon: "ImageIcon",
      category: "content",
    },
    {
      type: "latest-info",
      label: "最新情報",
      description: "赤い枠線の最新情報ブロック",
      icon: Star,
      category: "content",
    },
    //** rest of code here **/
  ]

  return (
    <div>
      {blockTypes.map((blockType) => (
        <div key={blockType.type}>
          <h2>{blockType.label}</h2>
          <p>{blockType.description}</p>
          <div>{blockType.icon}</div>
        </div>
      ))}
    </div>
  )
}

export default BlockTypeSelector
