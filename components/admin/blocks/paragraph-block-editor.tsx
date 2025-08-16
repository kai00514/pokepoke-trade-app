"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ParagraphBlockData {
  text: string
}

interface ParagraphBlockEditorProps {
  data: ParagraphBlockData
  onChange: (data: ParagraphBlockData) => void
}

export function ParagraphBlockEditor({ data, onChange }: ParagraphBlockEditorProps) {
  const handleChange = (text: string) => {
    onChange({ text })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">段落</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paragraph-text">テキスト</Label>
        <Textarea
          id="paragraph-text"
          value={data.text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="段落のテキストを入力"
          rows={4}
        />
      </div>

      {/* プレビュー */}
      {data.text && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{data.text}</p>
        </div>
      )}
    </div>
  )
}
