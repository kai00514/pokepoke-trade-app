"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, GripVertical } from "lucide-react"

interface FlexibleTableData {
  columns: Array<{
    id: string
    header: string
    width: "auto" | "narrow" | "wide"
    type: "text" | "number" | "badge"
  }>
  rows: Array<{
    id: string
    cells: Record<string, string>
  }>
  style: "default" | "striped" | "bordered"
}

interface FlexibleTableBlockEditorProps {
  data: FlexibleTableData
  onChange: (data: FlexibleTableData) => void
}

export function FlexibleTableBlockEditor({ data, onChange }: FlexibleTableBlockEditorProps) {
  const addColumn = () => {
    const newColumn = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      header: `列${data.columns.length + 1}`,
      width: "auto" as const,
      type: "text" as const,
    }
    onChange({
      ...data,
      columns: [...data.columns, newColumn],
      rows: data.rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [newColumn.id]: "" },
      })),
    })
  }

  const addRow = () => {
    const newRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cells: data.columns.reduce((acc, col) => ({ ...acc, [col.id]: "" }), {}),
    }
    onChange({
      ...data,
      rows: [...data.rows, newRow],
    })
  }

  const updateColumn = (columnId: string, updates: Partial<(typeof data.columns)[0]>) => {
    onChange({
      ...data,
      columns: data.columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col)),
    })
  }

  const deleteColumn = (columnId: string) => {
    onChange({
      ...data,
      columns: data.columns.filter((col) => col.id !== columnId),
      rows: data.rows.map((row) => {
        const { [columnId]: deleted, ...cells } = row.cells
        return { ...row, cells }
      }),
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">柔軟テーブル</Label>
        <div className="flex gap-2">
          <Select value={data.style} onValueChange={(value: any) => onChange({ ...data, style: value })}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">デフォルト</SelectItem>
              <SelectItem value="striped">ストライプ</SelectItem>
              <SelectItem value="bordered">枠線</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addColumn} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            列追加
          </Button>
          <Button onClick={addRow} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            行追加
          </Button>
        </div>
      </div>

      {/* 列設定 */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-sm font-medium mb-3 block">列設定</Label>
          <div className="space-y-3">
            {data.columns.map((column) => (
              <div key={column.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <GripVertical className="h-4 w-4 text-slate-400" />
                <Input
                  value={column.header}
                  onChange={(e) => updateColumn(column.id, { header: e.target.value })}
                  placeholder="列名"
                  className="flex-1"
                />
                <Select value={column.width} onValueChange={(value: any) => updateColumn(column.id, { width: value })}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自動</SelectItem>
                    <SelectItem value="narrow">狭い</SelectItem>
                    <SelectItem value="wide">広い</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={column.type} onValueChange={(value: any) => updateColumn(column.id, { type: value })}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">テキスト</SelectItem>
                    <SelectItem value="number">数値</SelectItem>
                    <SelectItem value="badge">バッジ</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => deleteColumn(column.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* テーブルデータ */}
      {data.columns.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-3 block">テーブルデータ</Label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100">
                    {data.columns.map((column) => (
                      <th key={column.id} className="border border-slate-200 p-2 text-left text-sm font-medium">
                        {column.header}
                      </th>
                    ))}
                    <th className="border border-slate-200 p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.id}>
                      {data.columns.map((column) => (
                        <td key={column.id} className="border border-slate-200 p-1">
                          {column.type === "text" ? (
                            <Textarea
                              value={row.cells[column.id] || ""}
                              onChange={(e) => updateCell(row.id, column.id, e.target.value)}
                              className="min-h-[60px] text-sm resize-none border-0 p-2"
                              placeholder="内容を入力"
                            />
                          ) : (
                            <Input
                              value={row.cells[column.id] || ""}
                              onChange={(e) => updateCell(row.id, column.id, e.target.value)}
                              className="text-sm border-0"
                              placeholder="値を入力"
                              type={column.type === "number" ? "number" : "text"}
                            />
                          )}
                        </td>
                      ))}
                      <td className="border border-slate-200 p-1 text-center">
                        <Button
                          onClick={() => deleteRow(row.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.columns.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <p>列が追加されていません</p>
          <p className="text-sm">「列追加」ボタンから列を追加してください</p>
        </div>
      )}
    </div>
  )
}
