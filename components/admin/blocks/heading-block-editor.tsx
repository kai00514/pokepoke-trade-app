"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface HeadingBlockEditorProps {
  data: {
    text: string
    level: number
  }
  onChange: (data: any) => void
}

const headingLevels = [
  { value: "1", label: "H1 - 大見出し" },
  { value: "2", label: "H2 - 中見出し" },
  { value: "3", label: "H3 - 小見出し" },
  { value: "4", label: "H4 - 極小見出し" },
]

export function HeadingBlockEditor({ data, onChange }: HeadingBlockEditorProps) {
  const [text, setText] = useState(data.text || "")
  const [level, setLevel] = useState(data.level?.toString() || "2")

  const handleTextChange = (value: string) => {
    setText(value)
    onChange({ ...data, text: value })
  }

  const handleLevelChange = (value: string) => {
    setLevel(value)
    onChange({ ...data, level: Number.parseInt(value) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>📝</span>
        見出しブロック
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="heading-text">見出しテキスト</Label>
          <Input
            id="heading-text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="見出しを入力してください"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heading-level">見出しレベル</Label>
          <Select value={level} onValueChange={handleLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder="見出しレベルを選択" />
            </SelectTrigger>
            <SelectContent>
              {headingLevels.map((levelOption) => (
                <SelectItem key={levelOption.value} value={levelOption.value}>
                  {levelOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* プレビュー */}
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="text-sm text-muted-foreground mb-2">プレビュー:</div>
        {level === "1" && <h1 className="text-3xl font-bold">{text || "見出しテキスト"}</h1>}
        {level === "2" && <h2 className="text-2xl font-semibold">{text || "見出しテキスト"}</h2>}
        {level === "3" && <h3 className="text-xl font-medium">{text || "見出しテキスト"}</h3>}
        {level === "4" && <h4 className="text-lg font-medium">{text || "見出しテキスト"}</h4>}
      </div>
    </div>
  )
}
