"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Info, CheckCircle } from "lucide-react"

interface CalloutBlockEditorProps {
  data: {
    body: string
    tone: "info" | "warning" | "success"
    title?: string
  }
  onChange: (data: any) => void
}

export function CalloutBlockEditor({ data, onChange }: CalloutBlockEditorProps) {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const tones = [
    { value: "info", label: "情報", icon: Info, color: "text-blue-600" },
    { value: "warning", label: "警告", icon: AlertCircle, color: "text-yellow-600" },
    { value: "success", label: "成功", icon: CheckCircle, color: "text-green-600" },
  ]

  const currentTone = tones.find((t) => t.value === data.tone) || tones[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">コールアウト</span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="callout-tone">トーン</Label>
            <Select value={data.tone} onValueChange={(value) => updateData("tone", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map((tone) => (
                  <SelectItem key={tone.value} value={tone.value}>
                    <div className="flex items-center space-x-2">
                      <tone.icon className={`h-4 w-4 ${tone.color}`} />
                      <span>{tone.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="callout-title">タイトル</Label>
            <Input
              id="callout-title"
              value={data.title || ""}
              onChange={(e) => updateData("title", e.target.value)}
              placeholder="タイトル（オプション）"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="callout-body">内容</Label>
          <Textarea
            id="callout-body"
            value={data.body}
            onChange={(e) => updateData("body", e.target.value)}
            placeholder="コールアウトの内容を入力"
            rows={3}
          />
        </div>
      </div>

      {/* プレビュー */}
      {data.body && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
          <div
            className={`rounded-lg border p-4 ${
              data.tone === "info"
                ? "bg-blue-50 border-blue-200"
                : data.tone === "warning"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-start space-x-2">
              <currentTone.icon className={`h-5 w-5 mt-0.5 ${currentTone.color}`} />
              <div className="flex-1">
                {data.title && <div className="font-semibold mb-1">{data.title}</div>}
                <div className="text-sm">{data.body}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
