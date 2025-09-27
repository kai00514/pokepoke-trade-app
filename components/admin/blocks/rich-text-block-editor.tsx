"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, ChevronDown, ChevronUp, Bold, Italic, Code, List, Quote } from "lucide-react"

interface RichTextData {
  content: string
  format: "html" | "markdown"
}

interface RichTextBlockEditorProps {
  data: RichTextData
  onChange: (data: RichTextData) => void
  onDelete: () => void
}

export function RichTextBlockEditor({ data, onChange, onDelete }: RichTextBlockEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = document.getElementById("rich-text-content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = data.content.substring(start, end)
    const replacement = selectedText || placeholder

    let newContent = ""
    switch (syntax) {
      case "bold":
        newContent = data.content.substring(0, start) + `**${replacement}**` + data.content.substring(end)
        break
      case "italic":
        newContent = data.content.substring(0, start) + `*${replacement}*` + data.content.substring(end)
        break
      case "code":
        newContent = data.content.substring(0, start) + `\`${replacement}\`` + data.content.substring(end)
        break
      case "list":
        newContent = data.content.substring(0, start) + `- ${replacement}` + data.content.substring(end)
        break
      case "quote":
        newContent = data.content.substring(0, start) + `> ${replacement}` + data.content.substring(end)
        break
      case "h2":
        newContent = data.content.substring(0, start) + `## ${replacement}` + data.content.substring(end)
        break
      case "h3":
        newContent = data.content.substring(0, start) + `### ${replacement}` + data.content.substring(end)
        break
    }

    onChange({ ...data, content: newContent })
  }

  const renderPreview = () => {
    if (data.format === "markdown") {
      // 簡単なMarkdownプレビュー
      const htmlContent = data.content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-sm'>$1</code>")
        .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold text-slate-900 mt-4 mb-2'>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold text-slate-900 mt-6 mb-3'>$1</h2>")
        .replace(
          /^> (.+)$/gm,
          "<blockquote class='border-l-4 border-slate-300 pl-4 italic text-slate-600'>$1</blockquote>",
        )
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>)/s, "<ul class='list-disc list-inside space-y-1'>$1</ul>")
        .replace(/\n\n/g, "</p><p class='mb-4'>")
        .replace(/\n/g, "<br>")

      return (
        <div
          className="prose prose-slate max-w-none p-4 border rounded-lg bg-slate-50 min-h-[200px]"
          dangerouslySetInnerHTML={{ __html: `<p class='mb-4'>${htmlContent}</p>` }}
        />
      )
    }

    return (
      <div
        className="prose prose-slate max-w-none p-4 border rounded-lg bg-slate-50 min-h-[200px]"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">リッチテキスト</CardTitle>
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
          <div>
            <Label className="text-sm font-medium">フォーマット</Label>
            <Select value={data.format} onValueChange={(value: any) => onChange({ ...data, format: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">エディター</TabsTrigger>
              <TabsTrigger value="preview">プレビュー</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-2">
              {data.format === "markdown" && (
                <div className="flex flex-wrap gap-1 p-2 border rounded-lg bg-slate-50">
                  <Button variant="ghost" size="sm" onClick={() => insertMarkdown("bold", "太字テキスト")}>
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertMarkdown("italic", "斜体テキスト")}>
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertMarkdown("code", "コード")}>
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertMarkdown("list", "リスト項目")}>
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertMarkdown("quote", "引用テキスト")}>
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertMarkdown("h2", "見出し2")}>
                    H2
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertMarkdown("h3", "見出し3")}>
                    H3
                  </Button>
                </div>
              )}

              <Textarea
                id="rich-text-content"
                value={data.content}
                onChange={(e) => onChange({ ...data, content: e.target.value })}
                placeholder={
                  data.format === "markdown"
                    ? "Markdownで記述してください...\n\n例:\n## 見出し\n**太字** *斜体* `コード`\n- リスト項目\n> 引用"
                    : "HTMLで記述してください..."
                }
                className="min-h-[300px] font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="preview">{renderPreview()}</TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  )
}
