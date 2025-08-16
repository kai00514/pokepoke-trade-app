"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, MoveUp, MoveDown } from "lucide-react"

interface HeadingBlockEditorProps {
  data: {
    text: string
    level: number | string
  }
  onChange: (data: any) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export function HeadingBlockEditor({ data, onChange, onDelete, onMoveUp, onMoveDown }: HeadingBlockEditorProps) {
  const [localData, setLocalData] = useState(data)

  const handleChange = (field: string, value: any) => {
    const newData = { ...localData, [field]: value }
    setLocalData(newData)
    onChange(newData)
  }

  const levelOptions = [
    { value: "1", label: "H1 - 大見出し" },
    { value: "2", label: "H2 - 中見出し" },
    { value: "3", label: "H3 - 小見出し" },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">見出し</CardTitle>
        <div className="flex items-center space-x-1">
          {onMoveUp && (
            <Button variant="ghost" size="sm" onClick={onMoveUp}>
              <MoveUp className="h-4 w-4" />
            </Button>
          )}
          {onMoveDown && (
            <Button variant="ghost" size="sm" onClick={onMoveDown}>
              <MoveDown className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="heading-text">見出しテキスト</Label>
          <Input
            id="heading-text"
            value={localData.text}
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="見出しを入力"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heading-level">見出しレベル</Label>
          <Select
            value={String(localData.level || "2")}
            onValueChange={(value) => handleChange("level", Number.parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="見出しレベルを選択" />
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* プレビュー */}
        <div className="border-t pt-4">
          <Label className="text-sm text-muted-foreground">プレビュー</Label>
          <div className="mt-2">
            {localData.level === 1 || localData.level === "1" ? (
              <h1 className="text-3xl font-bold">{localData.text || "見出しテキスト"}</h1>
            ) : localData.level === 2 || localData.level === "2" ? (
              <h2 className="text-2xl font-semibold">{localData.text || "見出しテキスト"}</h2>
            ) : (
              <h3 className="text-xl font-medium">{localData.text || "見出しテキスト"}</h3>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
