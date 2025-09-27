"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, FileText, Code, Type, Bold, Italic, List, Link2, ImageIcon } from "lucide-react"

interface RichTextBlockData {
  content: string
  format: "markdown" | "html" | "plain"
}

interface RichTextBlockEditorProps {
  data: RichTextBlockData
  onChange: (data: RichTextBlockData) => void
}

export function RichTextBlockEditor({ data, onChange }: RichTextBlockEditorProps) {
  const [showPreview, setShowPreview] = useState(false)

  const handleContentChange = (content: string) => {
    onChange({ ...data, content })
  }

  const handleFormatChange = (format: "markdown" | "html" | "plain") => {
    onChange({ ...data, format })
  }

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = document.querySelector("textarea[data-rich-text]") as HTMLTextAreaElement
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
      case "heading":
        newContent = data.content.substring(0, start) + `## ${replacement}` + data.content.substring(end)
        break
      case "link":
        newContent =
          data.content.substring(0, start) + `[${replacement || "リンクテキスト"}](URL)` + data.content.substring(end)
        break
      case "image":
        newContent =
          data.content.substring(0, start) + `![${replacement || "画像の説明"}](画像URL)` + data.content.substring(end)
        break
      case "list":
        newContent = data.content.substring(0, start) + `- ${replacement || "リスト項目"}` + data.content.substring(end)
        break
      case "code":
        newContent = data.content.substring(0, start) + `\`${replacement}\`` + data.content.substring(end)
        break
      case "quote":
        newContent =
          data.content.substring(0, start) + `{'>'}${" "}${replacement || "引用テキスト"}` + data.content.substring(end)
        break
      default:
        return
    }

    handleContentChange(newContent)
  }

  const renderPreview = () => {
    if (data.format === "html") {
      return <div dangerouslySetInnerHTML={{ __html: data.content }} />
    } else if (data.format === "markdown") {
      // 簡易的なMarkdownプレビュー
      const html = data.content
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
        .replace(/\*(.*)\*/gim, "<em>$1</em>")
        .replace(/!\[([^\]]*)\]$$([^$$]*)\)/gim, '<img alt="$1" src="$2" />')
        .replace(/\[([^\]]*)\]$$([^$$]*)\)/gim, '<a href="$2">$1</a>')
        .replace(/`([^`]*)`/gim, "<code>$1</code>")
        .replace(/^- (.*$)/gim, "<li>$1</li>")
        .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
        .replace(/\n/gim, "<br>")

      return <div dangerouslySetInnerHTML={{ __html: html }} />
    } else {
      return <div className="whitespace-pre-wrap">{data.content}</div>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            リッチテキスト
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={data.format} onValueChange={handleFormatChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="plain">プレーンテキスト</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? "編集" : "プレビュー"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.format === "markdown" && (
          <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded-md">
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("bold", "太字")} className="h-8 px-2">
              <Bold className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("italic", "斜体")} className="h-8 px-2">
              <Italic className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("heading", "見出し")} className="h-8 px-2">
              <Type className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("link")} className="h-8 px-2">
              <Link2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("image")} className="h-8 px-2">
              <ImageIcon className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("list")} className="h-8 px-2">
              <List className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("code", "コード")} className="h-8 px-2">
              <Code className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("quote", "引用")} className="h-8 px-2">
              {">"}
            </Button>
          </div>
        )}

        <Tabs value={showPreview ? "preview" : "editor"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" onClick={() => setShowPreview(false)}>
              編集
            </TabsTrigger>
            <TabsTrigger value="preview" onClick={() => setShowPreview(true)}>
              プレビュー
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-2">
            <Textarea
              data-rich-text
              value={data.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={
                data.format === "markdown"
                  ? "Markdownで記述してください...\n\n# 見出し1\n## 見出し2\n**太字** *斜体*\n- リスト項目\n[リンク](URL)\n![画像](URL)"
                  : data.format === "html"
                    ? "HTMLで記述してください...\n\n<h1>見出し1</h1>\n<p>段落テキスト</p>\n<strong>太字</strong>"
                    : "プレーンテキストを入力してください..."
              }
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="text-xs text-slate-500">{data.content.length} 文字</div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-2">
            <div className="min-h-[300px] p-4 border rounded-md bg-white prose prose-sm max-w-none">
              {data.content ? (
                renderPreview()
              ) : (
                <div className="text-slate-400 italic">プレビューするコンテンツがありません</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {data.format === "markdown" && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-600">Markdownヘルプ</Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div>
                  <code># 見出し1</code>
                </div>
                <div>
                  <code>## 見出し2</code>
                </div>
                <div>
                  <code>**太字**</code>
                </div>
                <div>
                  <code>*斜体*</code>
                </div>
              </div>
              <div className="space-y-1">
                <div>
                  <code>- リスト</code>
                </div>
                <div>
                  <code>[リンク](URL)</code>
                </div>
                <div>
                  <code>`コード`</code>
                </div>
                <div>
                  <code>{">"} 引用</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
