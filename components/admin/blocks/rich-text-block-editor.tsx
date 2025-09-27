"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Code, FileText } from "lucide-react"

interface RichTextData {
  content: string
  format: "markdown" | "html" | "plain"
}

interface RichTextBlockEditorProps {
  data: RichTextData
  onChange: (data: RichTextData) => void
}

export function RichTextBlockEditor({ data, onChange }: RichTextBlockEditorProps) {
  const [activeTab, setActiveTab] = useState("editor")

  const safeData: RichTextData = {
    content: data?.content || "",
    format: data?.format || "markdown",
  }

  const handleContentChange = (content: string) => {
    onChange({ ...safeData, content })
  }

  const handleFormatChange = (format: string) => {
    onChange({ ...safeData, format: format as RichTextData["format"] })
  }

  const renderPreview = () => {
    if (!safeData.content) {
      return <p className="text-slate-400 italic">プレビューするコンテンツがありません</p>
    }

    switch (safeData.format) {
      case "html":
        return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: safeData.content }} />
      case "markdown":
        // 簡易的なMarkdownプレビュー（実際の実装では適切なMarkdownパーサーを使用）
        return (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm">{safeData.content}</pre>
          </div>
        )
      case "plain":
        return (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{safeData.content}</p>
          </div>
        )
      default:
        return <p className="text-slate-400">未対応の形式です</p>
    }
  }

  const getPlaceholder = () => {
    switch (safeData.format) {
      case "html":
        return `<h2>見出し</h2>
<p>段落のテキストです。<strong>太字</strong>や<em>斜体</em>も使用できます。</p>
<ul>
  <li>リスト項目1</li>
  <li>リスト項目2</li>
</ul>`
      case "markdown":
        return `## 見出し

段落のテキストです。**太字**や*斜体*も使用できます。

- リスト項目1
- リスト項目2

[リンクテキスト](https://example.com)`
      case "plain":
        return "プレーンテキストを入力してください。\n\n改行やスペースがそのまま表示されます。"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">リッチテキスト</Label>
        <Select value={safeData.format} onValueChange={handleFormatChange}>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            エディター
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            プレビュー
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">
                {safeData.format === "markdown" && "Markdown記法が使用できます"}
                {safeData.format === "html" && "HTMLタグが使用できます"}
                {safeData.format === "plain" && "プレーンテキストとして表示されます"}
              </span>
            </div>
            <Textarea
              value={safeData.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={getPlaceholder()}
              rows={12}
              className="font-mono text-sm resize-none"
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-2">
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                プレビュー ({safeData.format})
              </CardTitle>
            </CardHeader>
            <CardContent>{renderPreview()}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* フォーマット別のヘルプ */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="text-sm space-y-2">
            {safeData.format === "markdown" && (
              <div>
                <p className="font-medium text-blue-900 mb-2">Markdown記法の例:</p>
                <div className="grid grid-cols-2 gap-4 text-xs text-blue-800">
                  <div>
                    <p>
                      <code># 見出し1</code>
                    </p>
                    <p>
                      <code>## 見出し2</code>
                    </p>
                    <p>
                      <code>**太字**</code>
                    </p>
                    <p>
                      <code>*斜体*</code>
                    </p>
                  </div>
                  <div>
                    <p>
                      <code>- リスト項目</code>
                    </p>
                    <p>
                      <code>[リンク](URL)</code>
                    </p>
                    <p>
                      <code>`コード`</code>
                    </p>
                    <p>
                      <code>{">"} 引用</code>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {safeData.format === "html" && (
              <div>
                <p className="font-medium text-blue-900 mb-2">HTML記法の例:</p>
                <div className="grid grid-cols-2 gap-4 text-xs text-blue-800">
                  <div>
                    <p>
                      <code>&lt;h2&gt;見出し&lt;/h2&gt;</code>
                    </p>
                    <p>
                      <code>&lt;p&gt;段落&lt;/p&gt;</code>
                    </p>
                    <p>
                      <code>&lt;strong&gt;太字&lt;/strong&gt;</code>
                    </p>
                  </div>
                  <div>
                    <p>
                      <code>&lt;ul&gt;&lt;li&gt;リスト&lt;/li&gt;&lt;/ul&gt;</code>
                    </p>
                    <p>
                      <code>&lt;a href="URL"&gt;リンク&lt;/a&gt;</code>
                    </p>
                    <p>
                      <code>&lt;code&gt;コード&lt;/code&gt;</code>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {safeData.format === "plain" && (
              <div>
                <p className="font-medium text-blue-900 mb-2">プレーンテキスト:</p>
                <p className="text-xs text-blue-800">
                  入力したテキストがそのまま表示されます。改行やスペースも保持されます。
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
