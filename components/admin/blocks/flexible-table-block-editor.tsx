"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, GripVertical } from "lucide-react"

interface FlexibleTableColumn {
  id: string
  header: string
  width: string
  type: "text" | "number" | "image" | "link"
}

interface FlexibleTableRow {
  id: string
  cells: Record<string, string>
}

interface FlexibleTableData {
  columns: FlexibleTableColumn[]
  rows: FlexibleTableRow[]
  style: "default" | "striped" | "bordered" | "compact"
}

interface FlexibleTableBlockEditorProps {
  data: FlexibleTableData
  onChange: (data: FlexibleTableData) => void
}

export function FlexibleTableBlockEditor({ data, onChange }: FlexibleTableBlockEditorProps) {
  const safeData: FlexibleTableData = {
    columns: data?.columns || [
      { id: "col1", header: "列1", width: "auto", type: "text" },
      { id: "col2", header: "列2", width: "auto", type: "text" },
    ],
    rows: data?.rows || [{ id: "row1", cells: { col1: "", col2: "" } }],
    style: data?.style || "default",
  }

  const handleColumnChange = (columnId: string, field: keyof FlexibleTableColumn, value: string) => {
    const updatedColumns = safeData.columns.map((col) => (col.id === columnId ? { ...col, [field]: value } : col))
    onChange({ ...safeData, columns: updatedColumns })
  }

  const handleAddColumn = () => {
    const newColumnId = `col${Date.now()}`
    const newColumn: FlexibleTableColumn = {
      id: newColumnId,
      header: `列${safeData.columns.length + 1}`,
      width: "auto",
      type: "text",
    }

    const updatedRows = safeData.rows.map((row) => ({
      ...row,
      cells: { ...row.cells, [newColumnId]: "" },
    }))

    onChange({
      ...safeData,
      columns: [...safeData.columns, newColumn],
      rows: updatedRows,
    })
  }

  const handleDeleteColumn = (columnId: string) => {
    const updatedColumns = safeData.columns.filter((col) => col.id !== columnId)
    const updatedRows = safeData.rows.map((row) => {
      const { [columnId]: deleted, ...remainingCells } = row.cells
      return { ...row, cells: remainingCells }
    })

    onChange({
      ...safeData,
      columns: updatedColumns,
      rows: updatedRows,
    })
  }

  const handleAddRow = () => {
    const newRow: FlexibleTableRow = {
      id: `row${Date.now()}`,
      cells: safeData.columns.reduce((acc, col) => ({ ...acc, [col.id]: "" }), {}),
    }
    onChange({ ...safeData, rows: [...safeData.rows, newRow] })
  }

  const handleDeleteRow = (rowId: string) => {
    const updatedRows = safeData.rows.filter((row) => row.id !== rowId)
    onChange({ ...safeData, rows: updatedRows })
  }

  const handleCellChange = (rowId: string, columnId: string, value: string) => {
    const updatedRows = safeData.rows.map((row) =>
      row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: value } } : row,
    )
    onChange({ ...safeData, rows: updatedRows })
  }

  const handleStyleChange = (style: string) => {
    onChange({ ...safeData, style: style as FlexibleTableData["style"] })
  }

  const renderCellInput = (row: FlexibleTableRow, column: FlexibleTableColumn) => {
    const value = row.cells[column.id] || ""

    switch (column.type) {
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleCellChange(row.id, column.id, e.target.value)}
            placeholder="数値を入力"
            className="text-sm"
          />
        )
      case "image":
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleCellChange(row.id, column.id, e.target.value)}
            placeholder="画像URLを入力"
            className="text-sm"
          />
        )
      case "link":
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleCellChange(row.id, column.id, e.target.value)}
            placeholder="リンクURLを入力"
            className="text-sm"
          />
        )
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleCellChange(row.id, column.id, e.target.value)}
            placeholder="テキストを入力"
            className="text-sm"
          />
        )
    }
  }

  const renderCellPreview = (row: FlexibleTableRow, column: FlexibleTableColumn) => {
    const value = row.cells[column.id] || ""

    if (!value) return <span className="text-slate-400 text-sm">-</span>

    switch (column.type) {
      case "image":
        return (
          <img
            src={value || "/placeholder.svg"}
            alt="テーブル画像"
            className="h-8 w-8 object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        )
      case "link":
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm truncate"
          >
            {value}
          </a>
        )
      default:
        return <span className="text-sm">{value}</span>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">柔軟テーブル</Label>
        <div className="flex items-center gap-2">
          <Select value={safeData.style} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">デフォルト</SelectItem>
              <SelectItem value="striped">ストライプ</SelectItem>
              <SelectItem value="bordered">ボーダー</SelectItem>
              <SelectItem value="compact">コンパクト</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 列設定 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">列設定</CardTitle>
            <Button onClick={handleAddColumn} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              列を追加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {safeData.columns.map((column, index) => (
            <div key={column.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <GripVertical className="h-4 w-4 text-slate-400" />
              <div className="flex-1 grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">ヘッダー</Label>
                  <Input
                    value={column.header}
                    onChange={(e) => handleColumnChange(column.id, "header", e.target.value)}
                    placeholder="列名"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">幅</Label>
                  <Select value={column.width} onValueChange={(value) => handleColumnChange(column.id, "width", value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">自動</SelectItem>
                      <SelectItem value="100px">100px</SelectItem>
                      <SelectItem value="150px">150px</SelectItem>
                      <SelectItem value="200px">200px</SelectItem>
                      <SelectItem value="300px">300px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">タイプ</Label>
                  <Select
                    value={column.type}
                    onValueChange={(value) =>
                      handleColumnChange(column.id, "type", value as FlexibleTableColumn["type"])
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">テキスト</SelectItem>
                      <SelectItem value="number">数値</SelectItem>
                      <SelectItem value="image">画像</SelectItem>
                      <SelectItem value="link">リンク</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => handleDeleteColumn(column.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    disabled={safeData.columns.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* データ入力 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">データ入力</CardTitle>
            <Button onClick={handleAddRow} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              行を追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {safeData.rows.map((row, rowIndex) => (
              <div key={row.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">行 {rowIndex + 1}</span>
                  <Button
                    onClick={() => handleDeleteRow(row.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    disabled={safeData.rows.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${safeData.columns.length}, 1fr)` }}>
                  {safeData.columns.map((column) => (
                    <div key={column.id}>
                      <Label className="text-xs">{column.header}</Label>
                      {renderCellInput(row, column)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* プレビュー */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">プレビュー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table
              className={`w-full text-sm ${
                safeData.style === "striped"
                  ? "table-striped"
                  : safeData.style === "bordered"
                    ? "border-collapse border border-slate-300"
                    : safeData.style === "compact"
                      ? "table-compact"
                      : ""
              }`}
            >
              <thead>
                <tr className="bg-slate-100">
                  {safeData.columns.map((column) => (
                    <th
                      key={column.id}
                      className={`p-2 text-left font-medium ${
                        safeData.style === "bordered" ? "border border-slate-300" : ""
                      }`}
                      style={{ width: column.width !== "auto" ? column.width : undefined }}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {safeData.rows.map((row, rowIndex) => (
                  <tr key={row.id} className={safeData.style === "striped" && rowIndex % 2 === 1 ? "bg-slate-50" : ""}>
                    {safeData.columns.map((column) => (
                      <td
                        key={column.id}
                        className={`p-2 ${safeData.style === "bordered" ? "border border-slate-300" : ""} ${
                          safeData.style === "compact" ? "py-1" : ""
                        }`}
                      >
                        {renderCellPreview(row, column)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
