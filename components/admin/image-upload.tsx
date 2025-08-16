"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { uploadImage } from "@/lib/actions/upload-image"
import { toast } from "sonner"
import Image from "next/image"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
}

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState("")

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setIsUploading(true)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const result = await uploadImage(formData)

        if (result.success && result.url) {
          onChange(result.url)
          toast.success("画像をアップロードしました")
        } else {
          toast.error(result.error || "アップロードに失敗しました")
        }
      } catch (error) {
        console.error("Upload error:", error)
        toast.error("アップロードに失敗しました")
      } finally {
        setIsUploading(false)
      }
    },
    [onChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setUrlInput("")
      toast.success("画像URLを設定しました")
    }
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove()
    } else {
      onChange("")
    }
    toast.success("画像を削除しました")
  }

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative">
          <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
            <Image src={value || "/placeholder.svg"} alt="アップロード済み画像" fill className="object-cover" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">アップロード</TabsTrigger>
            <TabsTrigger value="url">URL指定</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
                ${isUploading ? "pointer-events-none opacity-50" : ""}
              `}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-600">アップロード中...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    {isDragActive ? (
                      <p>ファイルをドロップしてください</p>
                    ) : (
                      <div>
                        <p>ファイルをドラッグ&ドロップするか、クリックして選択</p>
                        <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP, GIF (最大5MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">画像URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <Button type="button" onClick={handleUrlSubmit}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  設定
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
