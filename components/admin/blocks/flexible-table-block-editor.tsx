"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, ChevronDown, ChevronUp, GripVertical } from "lucide-react"

interface TableColumn {
  id: string
  header: string
  width: "narrow" | "normal" | "wide"
  type: "text" | "badge" | "number"
}

interface TableRow {
  id: string
  cells: Record<string, string>
}

interface FlexibleTableData {
  columns: TableColumn[]
  rows: TableRow[]
  style: "default" | "striped" | "bordered"
}

interface FlexibleTableBlockEditorProps {
  data: FlexibleTableData
  onChange: (data: FlexibleTableData) => void
  onDelete: () => void
}

export function FlexibleTableBlockEditor({ data, onChange, onDelete }: FlexibleTableBlockEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const addColumn = () => {
    const newColumn: TableColumn = {
      id: `col-${Date.now()}`,
      header: `列${data.columns.length + 1}`,
      width: "normal",
      type: "text",
    }

    const newRows = data.rows.map((row) => ({
      ...row,
      cells: { ...row.cells, [newColumn.id]: "" },
    }))

    onChange({
      ...data,
      columns: [...data.columns, newColumn],
      rows: newRows,
    })
  }

  const updateColumn = (columnId: string, updates: Partial<TableColumn>) => {
    onChange({
      ...data,
      columns: data.columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col)),
    })
  }

  const deleteColumn = (columnId: string) => {
    const newRows = data.rows.map((row) => {
      const { [columnId]: deleted, ...remainingCells } = row.cells
      return { ...row, cells: remainingCells }
    })

    onChange({
      ...data,
      columns: data.columns.filter((col) => col.id !== columnId),
      rows: newRows,
    })
  }

  const addRow = () => {
    const newRow: TableRow = {
      id: `row-${Date.now()}`,
      cells: data.columns.reduce((acc, col) => ({ ...acc, [col.id]: "" }), {}),
    }

    onChange({
      ...data,
      rows: [...data.rows, newRow],
    })
  }

  const updateCell = (rowId: string, columnId: string, value: string) => {
    onChange({
      ...data,
      rows: data.rows.map((row) => (row.id === rowId ? { ...row, cells: { ...row.cells, [columnId]: value } } : row)),
    })
  }

  const deleteRow = (rowId: string) => {
    onChange({
      ...data,
      rows: data.rows.filter((row) => row.id !== rowId),
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">柔軟テーブル</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* テーブルスタイル設定 */}
          <div>
            <Label className="text-sm font-medium">テーブルスタイル</Label>
            <Select value={data.style} onValueChange={(value: any) => onChange({ ...data, style: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">デフォルト</SelectItem>
                <SelectItem value="striped">ストライプ</SelectItem>
                <SelectItem value="bordered">ボーダー</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 列設定 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">列設定</Label>
              <Button variant="outline" size="sm" onClick={addColumn}>
                <Plus className="h-4 w-4 mr-1" />
                列を追加
              </Button>
            </div>

            <div className="space-y-2">
              {data.columns.map((column) => (
                <div key={column.id} className="flex items-center gap-2 p-2 border rounded">
                  <GripVertical className="h-4 w-4 text-slate-400" />
                  <Input
                    value={column.header}
                    onChange={(e) => updateColumn(column.id, { header: e.target.value })}
                    placeholder="列名"
                    className="flex-1"
                  />
                  <Select
                    value={column.width}
                    onValueChange={(value: any) => updateColumn(column.id, { width: value })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="narrow">狭い</SelectItem>
                      <SelectItem value="normal">普通</SelectItem>
                      <SelectItem value="wide">広い</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={column.type} onValueChange={(value: any) => updateColumn(column.id, { type: value })}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">テキスト</SelectItem>
                      <SelectItem value="badge">バッジ</SelectItem>
                      <SelectItem value="number">数値</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="sm" onClick={() => deleteColumn(column.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* テーブルデータ */}
          {data.columns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">テーブルデータ</Label>
                <Button variant="outline" size="sm" onClick={addRow}>
                  <Plus className="h-4 w-4 mr-1" />
                  行を追加
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      {data.columns.map((column) => (
                        <th key={column.id} className="px-3 py-2 text-left text-sm font-medium text-slate-700 border-b">
                          {column.header}
                        </th>
                      ))}
                      <th className="px-3 py-2 w-12 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, rowIndex) => (
                      <tr key={row.id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-25"}>
                        {data.columns.map((column) => (
                          <td key={column.id} className="px-3 py-2 border-b">
                            <Input
                              value={row.cells[column.id] || ""}
                              onChange={(e) => updateCell(row.id, column.id, e.target.value)}
                              placeholder={`${column.header}を入力`}
                              className="border-0 p-0 h-auto focus-visible:ring-0"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 border-b">
                          <Button variant="ghost" size="sm" onClick={() => deleteRow(row.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
