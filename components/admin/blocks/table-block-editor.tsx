"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface TableBlockData {
  headers: string[]
  rows: string[][]
}

interface TableBlockEditorProps {
  data: TableBlockData
  onChange: (data: TableBlockData) => void
}

export function TableBlockEditor({ data, onChange }: TableBlockEditorProps) {
  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...data.headers]
    newHeaders[index] = value
    onChange({ ...data, headers: newHeaders })
  }

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...data.rows]
    newRows[rowIndex][colIndex] = value
    onChange({ ...data, rows: newRows })
  }

  const addColumn = () => {
    const newHeaders = [...data.headers, `列${data.headers.length + 1}`]
    const newRows = data.rows.map((row) => [...row, ""])
    onChange({ headers: newHeaders, rows: newRows })
  }

  const removeColumn = (index: number) => {
    if (data.headers.length <= 1) return
    const newHeaders = data.headers.filter((_, i) => i !== index)
    const newRows = data.rows.map((row) => row.filter((_, i) => i !== index))
    onChange({ headers: newHeaders, rows: newRows })
  }

  const addRow = () => {
    const newRow = new Array(data.headers.length).fill("")
    onChange({ ...data, rows: [...data.rows, newRow] })
  }

  const removeRow = (index: number) => {
    if (data.rows.length <= 1) return
    const newRows = data.rows.filter((_, i) => i !== index)
    onChange({ ...data, rows: newRows })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">テーブル</span>
      </div>

      <div className="space-y-4">
        {/* ヘッダー */}
        <div className="space-y-2">
          <Label>ヘッダー</Label>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${data.headers.length}, 1fr) auto` }}>
            {data.headers.map((header, index) => (
              <Input
                key={index}
                value={header}
                onChange={(e) => handleHeaderChange(index, e.target.value)}
                placeholder={`ヘッダー${index + 1}`}
              />
            ))}
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" onClick={addColumn}>
                <Plus className="h-4 w-4" />
              </Button>
              {data.headers.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeColumn(data.headers.length - 1)}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 行 */}
        <div className="space-y-2">
          <Label>データ行</Label>
          {data.rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${data.headers.length}, 1fr) auto` }}
            >
              {row.map((cell, colIndex) => (
                <Input
                  key={colIndex}
                  value={cell}
                  onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                  placeholder={`行${rowIndex + 1}列${colIndex + 1}`}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeRow(rowIndex)}
                className="text-red-500"
                disabled={data.rows.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" onClick={addRow} className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            行を追加
          </Button>
        </div>
      </div>

      {/* プレビュー */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                {data.headers.map((header, index) => (
                  <th key={index} className="border border-gray-300 px-4 py-2 text-left font-medium">
                    {header || `ヘッダー${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border border-gray-300 px-4 py-2">
                      {cell || `セル${rowIndex + 1}-${colIndex + 1}`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
