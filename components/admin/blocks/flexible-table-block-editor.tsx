"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, ImageIcon } from "lucide-react"
import { DetailedSearchModal } from "@/components/detailed-search-modal"
import { useState } from "react"

interface FlexibleTableCell {
  id: string
  type: "text" | "number" | "image" | "link" | "empty"
  value: string
  cardId?: string
  cardName?: string
  cardImageUrl?: string
}

interface FlexibleTableRow {
  id: string
  cells: FlexibleTableCell[]
}

interface FlexibleTableData {
  rows: FlexibleTableRow[]
  style: "default" | "striped" | "bordered" | "compact"
  maxColumns: number
}

interface FlexibleTableBlockEditorProps {
  data: FlexibleTableData
  onChange: (data: FlexibleTableData) => void
}

export function FlexibleTableBlockEditor({ data, onChange }: FlexibleTableBlockEditorProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [selectedCellId, setSelectedCellId] = useState<string>("")
  const [selectedRowId, setSelectedRowId] = useState<string>("")

  const safeData: FlexibleTableData = {
    rows: data?.rows || [
      {
        id: "row1",
        cells: [
          { id: "cell1-1", type: "text", value: "" },
          { id: "cell1-2", type: "text", value: "" },
        ],
      },
    ],
    style: data?.style || "default",
    maxColumns: data?.maxColumns || 2,
  }

  const handleCellChange = (rowId: string, cellId: string, field: keyof FlexibleTableCell, value: any) => {
    const updatedRows = safeData.rows.map((row) =>
      row.id === rowId
        ? {
            ...row,
            cells: row.cells.map((cell) => (cell.id === cellId ? { ...cell, [field]: value } : cell)),
          }
        : row,
    )
    onChange({ ...safeData, rows: updatedRows })
  }

  const handleAddRow = () => {
    const newRowId = `row${Date.now()}`
    const newCells: FlexibleTableCell[] = []
    for (let i = 0; i < safeData.maxColumns; i++) {
      newCells.push({
        id: `cell${newRowId}-${i + 1}`,
        type: "text",
        value: "",
      })
    }
    const newRow: FlexibleTableRow = {
      id: newRowId,
      cells: newCells,
    }
    onChange({ ...safeData, rows: [...safeData.rows, newRow] })
  }

  const handleDeleteRow = (rowId: string) => {
    const updatedRows = safeData.rows.filter((row) => row.id !== rowId)
    onChange({ ...safeData, rows: updatedRows })
  }

  const handleAddColumn = () => {
    const newMaxColumns = safeData.maxColumns + 1
    const updatedRows = safeData.rows.map((row) => ({
      ...row,
      cells: [
        ...row.cells,
        {
          id: `cell${row.id}-${newMaxColumns}`,
          type: "text" as const,
          value: "",
        },
      ],
    }))
    onChange({ ...safeData, rows: updatedRows, maxColumns: newMaxColumns })
  }

  const handleDeleteColumn = (columnIndex: number) => {
    if (safeData.maxColumns <= 1) return
    const newMaxColumns = safeData.maxColumns - 1
    const updatedRows = safeData.rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, index) => index !== columnIndex),
    }))
    onChange({ ...safeData, rows: updatedRows, maxColumns: newMaxColumns })
  }

  const handleStyleChange = (style: string) => {
    onChange({ ...safeData, style: style as FlexibleTableData["style"] })
  }

  const handleCardSelect = (card: any) => {
    if (selectedRowId && selectedCellId) {
      handleCellChange(selectedRowId, selectedCellId, "cardId", card.id.toString())
      handleCellChange(selectedRowId, selectedCellId, "cardName", card.name)
      handleCellChange(selectedRowId, selectedCellId, "cardImageUrl", card.game8_image_url || card.image_url || "")
      handleCellChange(selectedRowId, selectedCellId, "value", card.name)
    }
    setSearchModalOpen(false)
    setSelectedCellId("")
    setSelectedRowId("")
  }

  const openCardModal = (rowId: string, cellId: string) => {
    setSelectedRowId(rowId)
    setSelectedCellId(cellId)
    setSearchModalOpen(true)
  }

  const renderCellInput = (row: FlexibleTableRow, cell: FlexibleTableCell, cellIndex: number) => {
    switch (cell.type) {
      case "empty":
        return <div className="h-10 bg-slate-100 rounded border-2 border-dashed border-slate-300"></div>

      case "number":
        return (
          <Input
            type="number"
            value={cell.value}
            onChange={(e) => handleCellChange(row.id, cell.id, "value", e.target.value)}
            placeholder="数値を入力"
            className="text-sm"
          />
        )

      case "image":
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => openCardModal(row.id, cell.id)}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                カード選択
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleCellChange(row.id, cell.id, "cardId", "")
                  handleCellChange(row.id, cell.id, "cardName", "")
                  handleCellChange(row.id, cell.id, "cardImageUrl", "")
                  handleCellChange(row.id, cell.id, "value", "")
                }}
                size="sm"
                variant="ghost"
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {cell.cardName && (
              <div className="text-xs text-slate-600 p-2 bg-slate-50 rounded">
                選択中: {cell.cardName} (ID: {cell.cardId})
              </div>
            )}
          </div>
        )

      case "link":
        return (
          <Input
            type="url"
            value={cell.value}
            onChange={(e) => handleCellChange(row.id, cell.id, "value", e.target.value)}
            placeholder="リンクURLを入力"
            className="text-sm"
          />
        )

      default:
        return (
          <Input
            value={cell.value}
            onChange={(e) => handleCellChange(row.id, cell.id, "value", e.target.value)}
            placeholder="テキストを入力"
            className="text-sm"
          />
        )
    }
  }

  const renderCellPreview = (cell: FlexibleTableCell) => {
    if (cell.type === "empty") {
      return <div className="h-8 bg-slate-100 rounded"></div>
    }

    if (!cell.value && !cell.cardImageUrl) {
      return <span className="text-slate-400 text-sm">-</span>
    }

    switch (cell.type) {
      case "image":
        if (cell.cardImageUrl) {
          return (
            <div className="flex flex-col items-center gap-1">
              <img
                src={cell.cardImageUrl || "/placeholder.svg"}
                alt={cell.cardName || "カード画像"}
                className="h-16 w-12 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
              {cell.cardName && <span className="text-xs text-slate-600">{cell.cardName}</span>}
            </div>
          )
        }
        return (
          <img
            src={cell.value || "/placeholder.svg"}
            alt="画像"
            className="h-12 w-12 object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg"
            }}
          />
        )

      case "link":
        return (
          <a
            href={cell.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm truncate"
          >
            {cell.value}
          </a>
        )

      default:
        return <span className="text-sm">{cell.value}</span>
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

      {/* 列操作 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">列操作</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddColumn} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                列を追加
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {Array.from({ length: safeData.maxColumns }, (_, index) => (
              <div key={index} className="flex-1 p-2 border rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">列 {index + 1}</span>
                  <Button
                    onClick={() => handleDeleteColumn(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    disabled={safeData.maxColumns <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
          <div className="space-y-4">
            {safeData.rows.map((row, rowIndex) => (
              <div key={row.id} className="border rounded-lg p-4">
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
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${safeData.maxColumns}, 1fr)` }}>
                  {row.cells.map((cell, cellIndex) => (
                    <div key={cell.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">セル {cellIndex + 1}</Label>
                        <Select
                          value={cell.type}
                          onValueChange={(value) =>
                            handleCellChange(row.id, cell.id, "type", value as FlexibleTableCell["type"])
                          }
                        >
                          <SelectTrigger className="w-24 h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">テキスト</SelectItem>
                            <SelectItem value="number">数値</SelectItem>
                            <SelectItem value="image">画像</SelectItem>
                            <SelectItem value="link">リンク</SelectItem>
                            <SelectItem value="empty">空</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {renderCellInput(row, cell, cellIndex)}
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
                  ? ""
                  : safeData.style === "bordered"
                    ? "border-collapse border border-slate-300"
                    : safeData.style === "compact"
                      ? ""
                      : ""
              }`}
            >
              <tbody>
                {safeData.rows.map((row, rowIndex) => (
                  <tr key={row.id} className={safeData.style === "striped" && rowIndex % 2 === 1 ? "bg-slate-50" : ""}>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.id}
                        className={`p-3 ${safeData.style === "bordered" ? "border border-slate-300" : ""} ${
                          safeData.style === "compact" ? "py-2" : ""
                        }`}
                      >
                        {renderCellPreview(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* カード選択モーダル */}
      <DetailedSearchModal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false)
          setSelectedCellId("")
          setSelectedRowId("")
        }}
        onCardSelect={handleCardSelect}
      />
    </div>
  )
}
