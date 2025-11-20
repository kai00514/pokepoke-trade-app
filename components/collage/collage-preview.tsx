"use client"

import { Button } from "@/components/ui/button"
import { Download, RotateCcw } from "lucide-react"
import { FaXTwitter } from "react-icons/fa6"

interface CollagePreviewProps {
  collageId: string
  collageImageUrl: string
  onReselect: () => void
  onShare: () => void
}

export default function CollagePreview({ collageId, collageImageUrl, onReselect, onShare }: CollagePreviewProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/collages/${collageId}/download`)
      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `collage-${collageId}.png`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading collage:", error)
      alert("ダウンロードに失敗しました")
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-100 rounded-lg p-6 flex justify-center">
        <img
          src={collageImageUrl || "/placeholder.svg"}
          alt="Collage preview"
          className="max-w-full h-auto rounded-lg"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleDownload} variant="outline" className="flex-1 bg-transparent">
          <Download className="h-4 w-4 mr-2" />
          ダウンロード
        </Button>
        <Button onClick={onReselect} variant="outline" className="flex-1 bg-transparent">
          <RotateCcw className="h-4 w-4 mr-2" />
          再選択
        </Button>
        <Button onClick={onShare} className="flex-1 bg-black hover:bg-gray-800 text-white transition-colors">
          <FaXTwitter className="h-4 w-4 mr-2" />
          Xに共有
        </Button>
      </div>
    </div>
  )
}
