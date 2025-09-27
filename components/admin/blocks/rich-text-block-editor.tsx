"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link,
  ImageIcon,
  List,
  ListOrdered,
  Code,
  Quote,
  Eye,
  EyeOff,
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

  const safeData: RichTextBlockData = {
    content: data?.content || "",
    format: data?.format || "markdown",
    style: data?.style || {},
  }

  const updateContent = (content: string) => {
    onChange({ ...safeData, content })
  }

  const updateFormat = (format: "markdown" | "html" | "plain") => {
    onChange({ ...safeData, format })
  }

  const updateStyle = (styleUpdate: Partial<RichTextBlockData["style"]>) => {
    onChange({
      ...safeData,
      style: { ...safeData.style, ...styleUpdate },
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
    } else if (syntax === "# ") {
      newText = `# ${replacement}`
    } else if (syntax === "## ") {
      newText = `## ${replacement}`
    } else if (syntax === "### ") {
      newText = `### ${replacement}`
    } else if (syntax === "[]()") {
      newText = `[${replacement}](url)`
    } else if (syntax === "![]()") {
      newText = `![${replacement}](image-url)`
    } else if (syntax === "- ") {
      newText = `- ${replacement}`
    } else if (syntax === "1. ") {
      newText = `1. ${replacement}`
    } else if (syntax === "`") {
      newText = `\`${replacement}\``
    } else if (syntax === "> ") {
      newText = `${"> "}${replacement}`
    }

    const newContent = safeData.content.substring(0, start) + newText + safeData.content.substring(end)
    updateContent(newContent)

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
      .replace(/`(.*?)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-sm'>$1</code>")
      .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold text-slate-900 mt-4 mb-2'>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold text-slate-900 mt-6 mb-3'>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold text-slate-900 mt-8 mb-4'>$1</h1>")
      .replace(
        /^> (.+)$/gm,
        "<blockquote class='border-l-4 border-slate-300 pl-4 italic text-slate-600 my-2'>$1</blockquote>",
      )
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul class='list-disc list-inside space-y-1 my-2'>$1</ul>")
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      .replace(/\[([^\]]+)\]$$([^)]+)$$/g, "<a href='$2' class='text-blue-600 hover:underline'>$1</a>")
      .replace(/!\[([^\]]*)\]$$([^)]+)$$/g, "<img src='$2' alt='$1' class='max-w-full h-auto rounded' />")
      .replace(/\n\n/g, "</p><p class='mb-4'>")
      .replace(/\n/g, "<br>")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">リッチテキスト</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={safeData.format} onValueChange={updateFormat}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="plain">プレーンテキスト</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowPreview(!showPreview)} size="sm" variant="outline">
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* スタイル設定 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="space-y-2">
            <Label className="text-xs">フォントサイズ</Label>
            <Select
              value={safeData.style?.fontSize || "text-base"}
              onValueChange={(value) => updateStyle({ fontSize: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="デフォルト" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text-sm">小</SelectItem>
                <SelectItem value="text-base">中</SelectItem>
                <SelectItem value="text-lg">大</SelectItem>
                <SelectItem value="text-xl">特大</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">文字色</Label>
            <Input
              type="color"
              value={safeData.style?.color || "#000000"}
              onChange={(e) => updateStyle({ color: e.target.value })}
              className="h-8 w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">背景色</Label>
            <Input
              type="color"
              value={safeData.style?.backgroundColor || "#ffffff"}
              onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
              className="h-8 w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">テキスト配置</Label>
            <Select
              value={safeData.style?.textAlign || "left"}
              onValueChange={(value: "left" | "center" | "right" | "justify") => updateStyle({ textAlign: value })}
            >
              <SelectTrigger className="h-8">
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

        {/* Markdownツールバー */}
        {safeData.format === "markdown" && (
          <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded-lg">
            <Button onClick={() => insertMarkdown("**", "太字テキスト")} size="sm" variant="ghost" title="太字">
              <Bold className="h-4 w-4" />
            </Button>
            <Button onClick={() => insertMarkdown("*", "斜体テキスト")} size="sm" variant="ghost" title="斜体">
              <Italic className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={() => insertMarkdown("# ", "見出し1")} size="sm" variant="ghost" title="見出し1">
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button onClick={() => insertMarkdown("## ", "見出し2")} size="sm" variant="ghost" title="見出し2">
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button onClick={() => insertMarkdown("### ", "見出し3")} size="sm" variant="ghost" title="見出し3">
              <Heading3 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={() => insertMarkdown("[]())", "リンクテキスト")} size="sm" variant="ghost" title="リンク">
              <Link className="h-4 w-4" />
            </Button>
            <Button onClick={() => insertMarkdown("![]()", "画像の説明")} size="sm" variant="ghost" title="画像">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={() => insertMarkdown("- ", "リスト項目")} size="sm" variant="ghost" title="箇条書きリスト">
              <List className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => insertMarkdown("1. ", "番号付きリスト項目")}
              size="sm"
              variant="ghost"
              title="番号付きリスト"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={() => insertMarkdown("`", "コード")} size="sm" variant="ghost" title="インラインコード">
              <Code className="h-4 w-4" />
            </Button>
            <Button onClick={() => insertMarkdown("> ", "引用")} size="sm" variant="ghost" title="引用">
              <Quote className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* エディター */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>コンテンツ</Label>
            <Textarea
              data-rich-text
              value={safeData.content}
              onChange={(e) => updateContent(e.target.value)}
              placeholder={
                safeData.format === "markdown"
                  ? "# 見出し\n\n**太字**や*斜体*を使えます。\n\n- リスト項目1\n- リスト項目2"
                  : safeData.format === "html"
                    ? "<h1>見出し</h1>\n<p><strong>太字</strong>や<em>斜体</em>を使えます。</p>"
                    : "プレーンテキストを入力してください"
              }
              className="min-h-[300px] font-mono text-sm"
              style={{
                fontSize: safeData.style?.fontSize,
                color: safeData.style?.color,
                backgroundColor: safeData.style?.backgroundColor,
                textAlign: safeData.style?.textAlign,
              }}
            />
          </div>

          {/* プレビュー */}
          {showPreview && (
            <div className="space-y-2">
              <Label>プレビュー</Label>
              <div className="min-h-[300px] p-4 border rounded-md bg-white overflow-auto">
                {safeData.format === "markdown" ? (
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownPreview(safeData.content),
                    }}
                  />
                ) : safeData.format === "html" ? (
                  <div
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: safeData.content }}
                  />
                ) : (
                  <div
                    className="whitespace-pre-wrap"
                    style={{
                      fontSize: safeData.style?.fontSize,
                      color: safeData.style?.color,
                      backgroundColor: safeData.style?.backgroundColor,
                      textAlign: safeData.style?.textAlign,
                    }}
                  >
                    {safeData.content}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div className="flex items-center space-x-4 text-sm text-slate-500">
          <Badge variant="secondary">{safeData.content.length} 文字</Badge>
          <Badge variant="secondary">
            {safeData.content.split(/\s+/).filter((word) => word.length > 0).length} 単語
          </Badge>
          <Badge variant="secondary">{safeData.content.split("\n").length} 行</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
