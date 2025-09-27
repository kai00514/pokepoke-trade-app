"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Link,
  ImageIcon,
  List,
  ListOrdered,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  Type,
} from "lucide-react"

interface RichTextBlockData {
  content: string
  format: "markdown" | "html" | "plain"
  style?: {
    fontSize?: string
    color?: string
    backgroundColor?: string
    textAlign?: "left" | "center" | "right" | "justify"
    fontWeight?: "normal" | "bold"
    fontStyle?: "normal" | "italic"
  }
}

interface RichTextBlockEditorProps {
  data: RichTextBlockData
  onChange: (data: RichTextBlockData) => void
}

export function RichTextBlockEditor({ data, onChange }: RichTextBlockEditorProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor")

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
    if (data.format !== "markdown") return

    const textarea = document.querySelector('textarea[data-rich-text="true"]') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const replacement = selectedText || placeholder

    let newText = ""
    switch (syntax) {
      case "bold":
        newText = `**${replacement}**`
        break
      case "italic":
        newText = `*${replacement}*`
        break
      case "heading1":
        newText = `# ${replacement}`
        break
      case "heading2":
        newText = `## ${replacement}`
        break
      case "heading3":
        newText = `### ${replacement}`
        break
      case "link":
        newText = `[${replacement || "リンクテキスト"}](URL)`
        break
      case "image":
        newText = `![${replacement || "画像の説明"}](画像URL)`
        break
      case "code":
        newText = `\`${replacement}\``
        break
      case "quote":
        newText = `${"> "}${replacement}`
        break
      case "list":
        newText = `- ${replacement}`
        break
      case "ordered-list":
        newText = `1. ${replacement}`
        break
      default:
        return
    }

    const newContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end)

    handleContentChange(newContent)

    // カーソル位置を調整
    setTimeout(() => {
      const newCursorPos = start + newText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const renderPreview = () => {
    if (!data.content) return <p className="text-gray-500">プレビューするコンテンツがありません</p>

    switch (data.format) {
      case "markdown":
        return renderMarkdownPreview(data.content)
      case "html":
        return <div dangerouslySetInnerHTML={{ __html: data.content }} />
      case "plain":
      default:
        return <div className="whitespace-pre-wrap">{data.content}</div>
    }
  }

  const renderMarkdownPreview = (content: string) => {
    // 簡易的なMarkdownパーサー
    const html = content
      // 見出し
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      // 太字・斜体
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // リンク
      .replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // 画像
      .replace(/!\[([^\]]*)\]$$([^)]+)$$/g, '<img src="$2" alt="$1" style="max-width: 100%;" />')
      // コード
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // 引用
      .replace(/^{"> "}(.*)$/gm, "<blockquote>$1</blockquote>")
      // リスト
      .replace(/^- (.*)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
      .replace(/^(\d+)\. (.*)$/gm, "<li>$2</li>")
      // 改行
      .replace(/\n/g, "<br>")

    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  const getStyleObject = () => {
    const style = data.style || {}
    return {
      fontSize: style.fontSize || "14px",
      color: style.color || "#000000",
      backgroundColor: style.backgroundColor || "transparent",
      textAlign: style.textAlign || "left",
      fontWeight: style.fontWeight || "normal",
      fontStyle: style.fontStyle || "normal",
    }
  }

  return (
    <div className="space-y-4">
      {/* フォーマット選択 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="format">形式:</Label>
          <Select value={data.format || "markdown"} onValueChange={handleFormatChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="plain">プレーンテキスト</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Markdownツールバー */}
      {data.format === "markdown" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Markdownツールバー</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1">
              <Button variant="outline" size="sm" onClick={() => insertMarkdown("bold", "太字")} title="太字">
                <Bold className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertMarkdown("italic", "斜体")} title="斜体">
                <Italic className="h-3 w-3" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={() => insertMarkdown("heading1", "見出し1")} title="見出し1">
                <Heading1 className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertMarkdown("heading2", "見出し2")} title="見出し2">
                <Heading2 className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertMarkdown("heading3", "見出し3")} title="見出し3">
                <Heading3 className="h-3 w-3" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm" onClick={() => insertMarkdown("link")} title="リンク">
                <Link className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertMarkdown("image")} title="画像">
                <ImageIcon className="h-3 w-3" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("list", "リスト項目")}
                title="箇条書きリスト"
              >
                <List className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("ordered-list", "リスト項目")}
                title="番号付きリスト"
              >
                <ListOrdered className="h-3 w-3" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertMarkdown("code", "コード")}
                title="インラインコード"
              >
                <Code className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => insertMarkdown("quote", "引用文")} title="引用">
                <Quote className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* スタイル設定 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">スタイル設定</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fontSize">フォントサイズ</Label>
              <Select
                value={data.style?.fontSize || "14px"}
                onValueChange={(value) => handleStyleChange("fontSize", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">小 (12px)</SelectItem>
                  <SelectItem value="14px">標準 (14px)</SelectItem>
                  <SelectItem value="16px">大 (16px)</SelectItem>
                  <SelectItem value="18px">特大 (18px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textAlign">テキスト配置</Label>
              <Select
                value={data.style?.textAlign || "left"}
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

            <div className="space-y-2">
              <Label htmlFor="color">文字色</Label>
              <input
                type="color"
                value={data.style?.color || "#000000"}
                onChange={(e) => handleStyleChange("color", e.target.value)}
                className="w-full h-9 rounded border border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">背景色</Label>
              <input
                type="color"
                value={data.style?.backgroundColor || "#ffffff"}
                onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                className="w-full h-9 rounded border border-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* エディター・プレビュータブ */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "editor" | "preview")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            エディター
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            プレビュー
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-2">
          <Label htmlFor="content">コンテンツ</Label>
          <Textarea
            id="content"
            data-rich-text="true"
            value={data.content || ""}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={
              data.format === "markdown"
                ? "Markdownで記述してください...\n\n例:\n# 見出し1\n## 見出し2\n**太字** *斜体*\n- リスト項目\n[リンク](URL)"
                : data.format === "html"
                  ? "HTMLタグを使用して記述してください...\n\n例:\n<h1>見出し1</h1>\n<p><strong>太字</strong> <em>斜体</em></p>\n<ul><li>リスト項目</li></ul>"
                  : "プレーンテキストを入力してください..."
            }
            rows={12}
            className="font-mono text-sm"
            style={getStyleObject()}
          />
          <p className="text-xs text-gray-500">
            {data.format === "markdown" && "Markdownツールバーを使用するか、直接記述してください"}
            {data.format === "html" && "HTMLタグを使用して記述してください"}
            {data.format === "plain" && "プレーンテキストとして表示されます"}
          </p>
        </TabsContent>

        <TabsContent value="preview" className="space-y-2">
          <Label>プレビュー</Label>
          <div className="min-h-[200px] p-4 border rounded-md bg-white" style={getStyleObject()}>
            {renderPreview()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
