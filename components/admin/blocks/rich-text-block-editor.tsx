"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Bold,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
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
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement
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
      case "list":
        newText = `- ${replacement || "リスト項目"}`
        break
      case "ordered-list":
        newText = `1. ${replacement || "番号付きリスト項目"}`
        break
      case "quote":
        newText = `{'>'}${" "}${replacement || "引用文"}`
        break
      case "code":
        newText = selectedText ? `\`${replacement}\`` : "```\n" + (replacement || "コード") + "\n```"
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
        .replace(/!\[([^\]]*)\]$$([^$$]*)\)/gim, '<img alt="$1" src="$2" />')
        .replace(/\[([^\]]*)\]$$([^$$]*)\)/gim, '<a href="$2">$1</a>')
        .replace(/^- (.*$)/gim, "<li>$1</li>")
        .replace(/^(\d+)\. (.*$)/gim, "<li>$2</li>")
        .replace(/`([^`]*)`/gim, "<code>$1</code>")
        .replace(/^{'>'}(.*)$/gim, "<blockquote>$1</blockquote>")
        .replace(/\n/gim, "<br>")

      return <div dangerouslySetInnerHTML={{ __html: html }} />
    } else {
      return <div style={{ whiteSpace: "pre-wrap" }}>{data.content}</div>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>リッチテキストブロック</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{data.format.toUpperCase()}</Badge>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? "編集" : "プレビュー"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="format">形式</Label>
            <Select value={data.format} onValueChange={handleFormatChange}>
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
          <div>
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
                <SelectItem value="center">中央寄せ</SelectItem>
                <SelectItem value="right">右寄せ</SelectItem>
                <SelectItem value="justify">両端揃え</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="fontSize">フォントサイズ</Label>
            <Input
              id="fontSize"
              value={data.style?.fontSize || ""}
              onChange={(e) => handleStyleChange("fontSize", e.target.value)}
              placeholder="16px"
            />
          </div>
          <div>
            <Label htmlFor="color">文字色</Label>
            <Input
              id="color"
              type="color"
              value={data.style?.color || "#000000"}
              onChange={(e) => handleStyleChange("color", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="backgroundColor">背景色</Label>
            <Input
              id="backgroundColor"
              type="color"
              value={data.style?.backgroundColor || "#ffffff"}
              onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
            />
          </div>
        </div>

        {data.format === "markdown" && (
          <div>
            <Label>Markdownツールバー</Label>
            <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-slate-50">
              <Button variant="ghost" size="sm" onClick={() => insertMarkdown("bold", "太字")} title="太字">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertMarkdown("italic", "斜体")} title="斜体">
                <Italic className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" onClick={() => insertMarkdown("heading1", "見出し1")} title="見出し1">
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertMarkdown("heading2", "見出し2")} title="見出し2">
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertMarkdown("heading3", "見出し3")} title="見出し3">
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
              <Button variant="ghost" size="sm" onClick={() => insertMarkdown("list")} title="リスト">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertMarkdown("ordered-list")} title="番号付きリスト">
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertMarkdown("quote")} title="引用">
                <Quote className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => insertMarkdown("code")} title="コード">
                <Code className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Tabs value={showPreview ? "preview" : "edit"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" onClick={() => setShowPreview(false)}>
              編集
            </TabsTrigger>
            <TabsTrigger value="preview" onClick={() => setShowPreview(true)}>
              プレビュー
            </TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="space-y-2">
            <Label htmlFor="content">コンテンツ</Label>
            <Textarea
              id="content"
              name="content"
              value={data.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={
                data.format === "markdown"
                  ? "# 見出し\n\n**太字**や*斜体*、[リンク](URL)などが使えます。"
                  : data.format === "html"
                    ? "<h1>見出し</h1>\n<p>HTMLタグが使えます。</p>"
                    : "プレーンテキストを入力してください。"
              }
              className="min-h-[200px] font-mono"
              style={{
                fontSize: data.style?.fontSize,
                color: data.style?.color,
                backgroundColor: data.style?.backgroundColor,
                textAlign: data.style?.textAlign,
              }}
            />
          </TabsContent>
          <TabsContent value="preview" className="space-y-2">
            <Label>プレビュー</Label>
            <div
              className="min-h-[200px] p-4 border rounded-md bg-white prose prose-sm max-w-none"
              style={{
                fontSize: data.style?.fontSize,
                color: data.style?.color,
                backgroundColor: data.style?.backgroundColor,
                textAlign: data.style?.textAlign,
              }}
            >
              {data.content ? renderPreview() : <p className="text-slate-400">プレビューがここに表示されます</p>}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
