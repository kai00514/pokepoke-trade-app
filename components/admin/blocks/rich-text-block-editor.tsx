"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"

interface RichTextData {
  content: string
  format: "markdown" | "html" | "plain"
  styles?: {
    fontSize?: string
    color?: string
    backgroundColor?: string
    textAlign?: "left" | "center" | "right" | "justify"
  }
}

interface RichTextBlockEditorProps {
  data: RichTextData
  onChange: (data: RichTextData) => void
}

export function RichTextBlockEditor({ data, onChange }: RichTextBlockEditorProps) {
  const [showPreview, setShowPreview] = useState(false)

  const safeData: RichTextData = {
    content: data?.content || "",
    format: data?.format || "markdown",
    styles: data?.styles || {},
  }

  const handleContentChange = (content: string) => {
    onChange({ ...safeData, content })
  }

  const handleFormatChange = (format: "markdown" | "html" | "plain") => {
    onChange({ ...safeData, format })
  }

  const handleStyleChange = (key: string, value: string) => {
    onChange({
      ...safeData,
      styles: { ...safeData.styles, [key]: value },
    })
  }

  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = document.querySelector("textarea[data-rich-text]") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = safeData.content.substring(start, end)
    const replacement = selectedText || placeholder

    let newText = ""
    if (syntax === "**") {
      newText = `**${replacement}**`
    } else if (syntax === "*") {
      newText = `*${replacement}*`
    } else if (syntax === "#") {
      newText = `# ${replacement}`
    } else if (syntax === "##") {
      newText = `## ${replacement}`
    } else if (syntax === "###") {
      newText = `### ${replacement}`
    } else if (syntax === "link") {
      newText = `[${replacement || "リンクテキスト"}](URL)`
    } else if (syntax === "image") {
      newText = `![${replacement || "画像の説明"}](画像URL)`
    } else if (syntax === "ul") {
      newText = `- ${replacement || "リスト項目"}`
    } else if (syntax === "ol") {
      newText = `1. ${replacement || "リスト項目"}`
    } else if (syntax === "code") {
      newText = `\`${replacement || "コード"}\``
    } else if (syntax === "quote") {
      newText = `{"> "}${replacement || "引用テキスト"}`
    }

    const newContent = safeData.content.substring(0, start) + newText + safeData.content.substring(end)
    handleContentChange(newContent)

    // フォーカスを戻す
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
  }

  const renderMarkdownPreview = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-slate-900 mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-900 mt-8 mb-4">$1</h1>')
      .replace(
        /^> (.+)$/gm,
        '<blockquote class="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-2">$1</blockquote>',
      )
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
      .replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      .replace(/!\[([^\]]*)\]$$([^)]+)$$/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded" />')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, "<br>")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">リッチテキスト</Label>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowPreview(!showPreview)} size="sm" variant="outline">
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? "編集" : "プレビュー"}
          </Button>
        </div>
      </div>

      {/* フォーマット選択 */}
      <div className="space-y-2">
        <Label>フォーマット</Label>
        <Select value={safeData.format} onValueChange={handleFormatChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="markdown">Markdown</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="plain">プレーンテキスト</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* スタイル設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">スタイル設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>フォントサイズ</Label>
              <Select
                value={safeData.styles?.fontSize || "medium"}
                onValueChange={(value) => handleStyleChange("fontSize", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">小</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="large">大</SelectItem>
                  <SelectItem value="xl">特大</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>テキスト色</Label>
              <Input
                type="color"
                value={safeData.styles?.color || "#000000"}
                onChange={(e) => handleStyleChange("color", e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>背景色</Label>
              <Input
                type="color"
                value={safeData.styles?.backgroundColor || "#ffffff"}
                onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>テキスト配置</Label>
              <Select
                value={safeData.styles?.textAlign || "left"}
                onValueChange={(value) => handleStyleChange("textAlign", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">左寄せ</SelectItem>
                  <SelectItem value="center">中央</SelectItem>
                  <SelectItem value="right">右寄せ</SelectItem>
                  <SelectItem value="justify">両端揃え</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Markdownツールバー */}
      {safeData.format === "markdown" && !showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Markdownツールバー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => insertMarkdown("**", "太字テキスト")} size="sm" variant="outline" title="太字">
                <Bold className="h-4 w-4" />
              </Button>
              <Button onClick={() => insertMarkdown("*", "斜体テキスト")} size="sm" variant="outline" title="斜体">
                <Italic className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <Button onClick={() => insertMarkdown("#", "見出し1")} size="sm" variant="outline" title="見出し1">
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button onClick={() => insertMarkdown("##", "見出し2")} size="sm" variant="outline" title="見出し2">
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button onClick={() => insertMarkdown("###", "見出し3")} size="sm" variant="outline" title="見出し3">
                <Heading3 className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <Button onClick={() => insertMarkdown("link")} size="sm" variant="outline" title="リンク">
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button onClick={() => insertMarkdown("image")} size="sm" variant="outline" title="画像">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <Button onClick={() => insertMarkdown("ul")} size="sm" variant="outline" title="箇条書きリスト">
                <List className="h-4 w-4" />
              </Button>
              <Button onClick={() => insertMarkdown("ol")} size="sm" variant="outline" title="番号付きリスト">
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <Button
                onClick={() => insertMarkdown("code", "コード")}
                size="sm"
                variant="outline"
                title="インラインコード"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button onClick={() => insertMarkdown("quote", "引用テキスト")} size="sm" variant="outline" title="引用">
                <Quote className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* コンテンツ入力/プレビュー */}
      {showPreview ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">プレビュー</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-slate max-w-none min-h-[200px] p-4 border rounded-lg bg-white"
              style={{
                fontSize:
                  safeData.styles?.fontSize === "small"
                    ? "14px"
                    : safeData.styles?.fontSize === "large"
                      ? "18px"
                      : safeData.styles?.fontSize === "xl"
                        ? "20px"
                        : "16px",
                color: safeData.styles?.color,
                backgroundColor: safeData.styles?.backgroundColor,
                textAlign: safeData.styles?.textAlign,
              }}
            >
              {safeData.format === "markdown" ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: `<p class="mb-4">${renderMarkdownPreview(safeData.content)}</p>`,
                  }}
                />
              ) : safeData.format === "html" ? (
                <div dangerouslySetInnerHTML={{ __html: safeData.content }} />
              ) : (
                <div style={{ whiteSpace: "pre-wrap" }}>{safeData.content}</div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <Label>コンテンツ</Label>
          <Textarea
            data-rich-text
            value={safeData.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={
              safeData.format === "markdown"
                ? "Markdownで記述してください...\n\n例:\n# 見出し\n**太字** *斜体*\n- リスト項目"
                : safeData.format === "html"
                  ? "HTMLで記述してください...\n\n例:\n<h1>見出し</h1>\n<p><strong>太字</strong> <em>斜体</em></p>"
                  : "プレーンテキストで記述してください..."
            }
            className="min-h-[200px] font-mono text-sm"
            style={{
              fontSize:
                safeData.styles?.fontSize === "small"
                  ? "12px"
                  : safeData.styles?.fontSize === "large"
                    ? "16px"
                    : safeData.styles?.fontSize === "xl"
                      ? "18px"
                      : "14px",
            }}
          />
        </div>
      )}

      {/* フォーマット情報 */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {safeData.format === "markdown" ? "Markdown" : safeData.format === "html" ? "HTML" : "プレーンテキスト"}
        </Badge>
        <span className="text-sm text-slate-500">{safeData.content.length} 文字</span>
      </div>
    </div>
  )
}
