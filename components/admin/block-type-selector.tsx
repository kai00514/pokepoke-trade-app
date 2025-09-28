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
    // /** rest of code here **/
  ]

  return (
    <div>
      {/* /** rest of code here **/ */}
    </div>
  );
}

export default BlockTypeSelector
\
