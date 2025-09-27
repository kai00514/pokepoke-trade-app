"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  LinkIcon,
  ImageIcon,
  List,
  ListOrdered,
  Code,
  Quote,
  Eye,
  EyeOff,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react"

interface RichTextBlockData {
  content: string
  format: "markdown" | "html" | "plain"
  style?: {
    fontSize?: string
    color?: string
    backgroundColor?: string
    textAlign?: "left" | "center" | "right" | "justify"
  }
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

  const handleStyleChange = (styleKey: string, value: string) => {
    onChange({
      ...data,
      style: {
        ...data.style,
        [styleKey]: value,
      },
    })
  }

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = document.querySelector("textarea[data-rich-text]") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = data.content.substring(start, end)
    const replacement = selectedText || placeholder

    let newContent = ""
    if (syntax === "link") {
      newContent =
        data.content.substring(0, start) + `[${replacement || "リンクテキスト"}](URL)` + data.content.substring(end)
    } else if (syntax === "image") {
      newContent =
        data.content.substring(0, start) + `![${replacement || "画像の説明"}](画像URL)` + data.content.substring(end)
    } else if (syntax === "code") {
      newContent = data.content.substring(0, start) + `\`${replacement || "コード"}\`` + data.content.substring(end)
    } else if (syntax === "quote") {
      newContent =
        data.content.substring(0, start) + `${"> "}${replacement || "引用テキスト"}` + data.content.substring(end)
    } else {
      newContent = data.content.substring(0, start) + syntax + replacement + syntax + data.content.substring(end)
    }

    handleContentChange(newContent)
  }

  const renderPreview = () => {
    if (data.format === "html") {
      return <div dangerouslySetInnerHTML={{ __html: data.content }} />
    } else if (data.format === "markdown") {
      // 簡易的なMarkdownパーサー
      const html = data.content
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
        .replace(/\*(.*)\*/gim, "<em>$1</em>")
        .replace(/\[([^\]]+)\]$$([^)]+)$$/gim, '<a href="$2">$1</a>')
        .replace(/!\[([^\]]*)\]$$([^)]+)$$/gim, '<img alt="$1" src="$2" />')
        .replace(/`([^`]+)`/gim, "<code>$1</code>")
        .replace(/^> (.*)$/gim, "<blockquote>$1</blockquote>")
        .replace(/^\* (.*)$/gim, "<li>$1</li>")
        .replace(/^(\d+)\. (.*)$/gim, "<li>$1. $2</li>")
        .replace(/\n/gim, "<br>")

      return <div dangerouslySetInnerHTML={{ __html: html }} />
    } else {
      return <div style={{ whiteSpace: "pre-wrap" }}>{data.content}</div>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">リッチテキスト</CardTitle>
          <div className="flex items-center space-x-2">
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
        {/* スタイル設定 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1">
              <Type className="h-3 w-3" />
              フォントサイズ
            </Label>
            <Select
              value={data.style?.fontSize || "16px"}
              onValueChange={(value) => handleStyleChange("fontSize", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12px">12px</SelectItem>
                <SelectItem value="14px">14px</SelectItem>
                <SelectItem value="16px">16px</SelectItem>
                <SelectItem value="18px">18px</SelectItem>
                <SelectItem value="20px">20px</SelectItem>
                <SelectItem value="24px">24px</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1">
              <Palette className="h-3 w-3" />
              文字色
            </Label>
            <Input
              type="color"
              value={data.style?.color || "#000000"}
              onChange={(e) => handleStyleChange("color", e.target.value)}
              className="h-10 w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">背景色</Label>
            <Input
              type="color"
              value={data.style?.backgroundColor || "#ffffff"}
              onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
              className="h-10 w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">テキスト配置</Label>
            <Select
              value={data.style?.textAlign || "left"}
              onValueChange={(value) => handleStyleChange("textAlign", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="h-4 w-4" />
                    左揃え
                  </div>
                </SelectItem>
                <SelectItem value="center">
                  <div className="flex items-center gap-2">
                    <AlignCenter className="h-4 w-4" />
                    中央揃え
                  </div>
                </SelectItem>
                <SelectItem value="right">
                  <div className="flex items-center gap-2">
                    <AlignRight className="h-4 w-4" />
                    右揃え
                  </div>
                </SelectItem>
                <SelectItem value="justify">
                  <div className="flex items-center gap-2">
                    <AlignJustify className="h-4 w-4" />
                    両端揃え
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Markdownツールバー */}
        {data.format === "markdown" && !showPreview && (
          <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded-md">
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("**", "太字テキスト")} title="太字">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("*", "斜体テキスト")} title="斜体">
              <Italic className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("# ", "")} title="見出し1">
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("## ", "")} title="見出し2">
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("### ", "")} title="見出し3">
              <Heading3 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("link")} title="リンク">
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("image")} title="画像">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("* ", "")} title="箇条書きリスト">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("1. ", "")} title="番号付きリスト">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("code")} title="インラインコード">
              <Code className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertMarkdown("quote")} title="引用">
              <Quote className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* エディター/プレビュー */}
        <Tabs value={showPreview ? "preview" : "editor"} className="w-full">
          <TabsContent value="editor" className="mt-0">
            <div className="space-y-2">
              <Label>コンテンツ</Label>
              <Textarea
                data-rich-text
                value={data.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={
                  data.format === "markdown"
                    ? "Markdownで記述してください...\n\n# 見出し1\n## 見出し2\n**太字** *斜体*\n[リンク](URL)\n![画像](URL)"
                    : data.format === "html"
                      ? "HTMLで記述してください...\n\n<h1>見出し1</h1>\n<p><strong>太字</strong> <em>斜体</em></p>"
                      : "プレーンテキストを入力してください..."
                }
                rows={12}
                className="font-mono text-sm"
                style={{
                  fontSize: data.style?.fontSize,
                  color: data.style?.color,
                  backgroundColor: data.style?.backgroundColor,
                  textAlign: data.style?.textAlign,
                }}
              />
            </div>
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <div className="space-y-2">
              <Label>プレビュー</Label>
              <div
                className="min-h-[300px] p-4 border rounded-md bg-white prose prose-sm max-w-none"
                style={{
                  fontSize: data.style?.fontSize,
                  color: data.style?.color,
                  backgroundColor: data.style?.backgroundColor,
                  textAlign: data.style?.textAlign,
                }}
              >
                {data.content ? (
                  renderPreview()
                ) : (
                  <p className="text-slate-400">プレビューするコンテンツがありません</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* フォーマット情報 */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{data.format.toUpperCase()}</Badge>
          <span className="text-sm text-slate-500">{data.content.length} 文字</span>
        </div>
      </CardContent>
    </Card>
  )
}
