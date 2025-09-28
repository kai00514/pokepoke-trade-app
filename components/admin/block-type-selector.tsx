import type React from "react"
import { Table } from "react-feather"

const BlockTypeSelector: React.FC = () => {
  const blockTypes = [
    {
      type: "key-value-table",
      label: "キー・バリューテーブル",
      description: "1列目がヘッダー、2列目にテキストやカードを表示",
      icon: <Table className="h-4 w-4" />,
      category: "content",
    },
    {
      type: "cards-table",
      label: "カードテーブル",
      description: "複数のカードを表示するテーブル",
      icon: <Table className="h-4 w-4" />,
      category: "content",
    },
    {
      type: "card-display-table",
      label: "カード表示テーブル",
      description: "カードを詳細に表示するテーブル",
      icon: <Table className="h-4 w-4" />,
      category: "content",
    },
    {
      type: "evaluation",
      label: "評価",
      description: "評価を表示するテーブル",
      icon: <Table className="h-4 w-4" />,
      category: "content",
    },
    {
      type: "key-value-table",
      label: "キー・バリューテーブル",
      description: "1列目がヘッダー、2列目にテキストやカードを表示",
      category: "ポケモンカード専用",
    },
    // Additional block types can be added here
  ]

  return <div>{/* Render block types here */}</div>
}

export default BlockTypeSelector
