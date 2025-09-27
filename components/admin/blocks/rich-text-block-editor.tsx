"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bold, Italic, Underline, Link, List, ListOrdered, Quote, Code } from "lucide-react"

interface RichTextData {
  content: string
  format: "html" | "markdown"
}

interface RichTextBlockEditorProps {
  data: RichTextData
  onChange: (data: RichTextData) => void
}

export function RichTextBlockEditor({ data, onChange }: RichTextBlockEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // データの初期化
  const safeData = data || { content: "", format: "markdown" }

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const newText = before + selectedText + after

    const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end)
    onChange({ ...safeData, content: newValue })

    // カーソル位置を調整
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const formatButtons = [
    { icon: Bold, label: "太字", action: () => insertText("**", "**") },
    { icon: Italic, label: "斜体", action: () => insertText("*", "*") },
    { icon: Underline, label: "下線", action: () => insertText("<u>", "</u>") },
    { icon: Link, label: "リンク", action: () => insertText("[", "](URL)") },
    { icon: List, label: "箇条書き", action: () => insertText("- ") },
    { icon: ListOrdered, label: "番号付きリスト", action: () => insertText("1. ") },
    { icon: Quote, label: "引用", action: () => insertText("> ") },
    { icon: Code, label: "コード", action: () => insertText("`", "`") },
  ]

  const renderPreview = () => {
    if (safeData.format === "markdown") {
      // 簡単なMarkdownプレビュー
      return safeData.content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
        .replace(/\n/g, "<br>")
    }
    return safeData.content
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">リッチテキスト</Label>
        <div className="flex items-center gap-2">
          <Select value={safeData.format} onValueChange={(value: any) => onChange({ ...safeData, format: value })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsPreview(!isPreview)} size="sm" variant={isPreview ? "default" : "outline"}>
            {isPreview ? "編集" : "プレビュー"}
          </Button>
        </div>
      </div>

      {!isPreview && (
        <>
          {/* ツールバー */}
          <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 rounded-lg border">
            {formatButtons.map((button, index) => (
              <Button
                key={index}
                onClick={button.action}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                title={button.label}
              >
                <button.icon className="h-4 w-4" />
              </Button>
            ))}
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              onClick={() => insertText("## ")}
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs font-bold"
              title="見出し2"
            >
              H2
            </Button>
            <Button
              onClick={() => insertText("### ")}
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs font-bold"
              title="見出し3"
            >
              H3
            </Button>
          </div>

          {/* エディター */}
          <Textarea
            ref={textareaRef}
            value={safeData.content}
            onChange={(e) => onChange({ ...safeData, content: e.target.value })}
            className="w-full min-h-[300px] p-4 border border-slate-200 rounded-lg resize-y font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={
              safeData.format === "markdown"
                ? "Markdownで記述してください...\n\n**太字** *斜体* `コード`\n## 見出し\n- リスト項目"
                : "HTMLで記述してください..."
            }
          />
        </>
      )}

      {isPreview && (
        <div className="min-h-[300px] p-4 border border-slate-200 rounded-lg bg-white">
          <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: renderPreview() }} />
        </div>
      )}

      <div className="text-xs text-slate-500">
        {safeData.format === "markdown" ? (
          <p>Markdown記法を使用できます。**太字**、*斜体*、`コード`、## 見出し、- リスト、&gt; 引用</p>
        ) : (
          <p>
            HTML記法を使用できます。&lt;strong&gt;、&lt;em&gt;、&lt;code&gt;、&lt;h2&gt;、&lt;ul&gt;、&lt;blockquote&gt;
          </p>
        )}
      </div>
    </div>
  )
}
