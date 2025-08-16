"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ButtonBlockData {
  text: string
  url: string
  variant: "primary" | "secondary" | "outline"
}

interface ButtonBlockEditorProps {
  data: ButtonBlockData
  onChange: (data: ButtonBlockData) => void
}

const variants = [
  { value: "primary", label: "プライマリ", className: "bg-blue-600 text-white hover:bg-blue-700" },
  { value: "secondary", label: "セカンダリ", className: "bg-gray-600 text-white hover:bg-gray-700" },
  { value: "outline", label: "アウトライン", className: "border border-blue-600 text-blue-600 hover:bg-blue-50" },
]

export function ButtonBlockEditor({ data, onChange }: ButtonBlockEditorProps) {
  const handleChange = (field: keyof ButtonBlockData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const currentVariant = variants.find((v) => v.value === data.variant) || variants[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">ボタン</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="button-text">ボタンテキスト</Label>
          <Input
            id="button-text"
            value={data.text}
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="ボタンのテキスト"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="button-variant">スタイル</Label>
          <Select
            value={data.variant}
            onValueChange={(value: "primary" | "secondary" | "outline") => handleChange("variant", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variants.map((variant) => (
                <SelectItem key={variant.value} value={variant.value}>
                  {variant.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="button-url">リンクURL</Label>
        <Input
          id="button-url"
          type="url"
          value={data.url}
          onChange={(e) => handleChange("url", e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      {/* プレビュー */}
      {data.text && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
          <button className={`px-6 py-2 rounded-lg font-medium transition-colors ${currentVariant.className}`} disabled>
            {data.text}
          </button>
        </div>
      )}
    </div>
  )
}
