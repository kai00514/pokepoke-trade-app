"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "../image-upload"

interface ImageBlockEditorProps {
  data: {
    url: string
    alt: string
    caption?: string
    aspect: string
  }
  onChange: (data: any) => void
}

export function ImageBlockEditor({ data, onChange }: ImageBlockEditorProps) {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const aspectRatios = [
    { value: "16:9", label: "16:9 (横長)" },
    { value: "4:3", label: "4:3 (標準)" },
    { value: "1:1", label: "1:1 (正方形)" },
    { value: "3:4", label: "3:4 (縦長)" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">画像</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>画像URL</Label>
          <ImageUpload value={data.url} onChange={(url) => updateData("url", url)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="alt">代替テキスト</Label>
            <Input
              id="alt"
              value={data.alt}
              onChange={(e) => updateData("alt", e.target.value)}
              placeholder="画像の説明"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aspect">アスペクト比</Label>
            <Select value={data.aspect} onValueChange={(value) => updateData("aspect", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">キャプション</Label>
          <Input
            id="caption"
            value={data.caption || ""}
            onChange={(e) => updateData("caption", e.target.value)}
            placeholder="画像の説明文（オプション）"
          />
        </div>
      </div>

      {/* プレビュー */}
      {data.url && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <img
              src={data.url || "/placeholder.svg"}
              alt={data.alt}
              className="w-full h-auto object-cover"
              style={{ aspectRatio: data.aspect }}
            />
            {data.caption && <div className="p-2 text-sm text-gray-600 text-center">{data.caption}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
