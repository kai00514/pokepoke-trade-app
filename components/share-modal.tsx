"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check, Twitter } from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title: string
}

export function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy URL:", error)
    }
  }

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    window.open(twitterUrl, "_blank", "noopener,noreferrer")
  }

  const handleShareLine = () => {
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(title + " " + url)}`
    window.open(lineUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-xl">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-[#1F2937] line-clamp-1">
              この投稿をシェア
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 mt-4">
          {/* URLコピー */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-[#6B7280]">リンクをコピー</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 px-3 py-2.5 bg-[#F3F4F6] rounded-lg border border-[#E5E7EB] text-xs sm:text-sm text-[#4B5563] truncate">
                {url}
              </div>
              <Button
                onClick={handleCopyUrl}
                className={`h-10 sm:h-12 px-4 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${
                  copied
                    ? "bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857]"
                    : "bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8]"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
                    <span className="text-xs sm:text-sm">コピー済み</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
                    <span className="text-xs sm:text-sm">コピー</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* SNSシェア */}
          <div className="space-y-3">
            <label className="text-xs sm:text-sm font-semibold text-[#6B7280]">SNSでシェア</label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {/* X (Twitter) */}
              <Button
                onClick={handleShareTwitter}
                className="h-11 sm:h-12 bg-[#000000] hover:bg-[#1a1a1a] text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                <span className="text-xs sm:text-sm truncate">X でシェア</span>
              </Button>

              {/* LINE */}
              <Button
                onClick={handleShareLine}
                className="h-11 sm:h-12 bg-[#06C755] hover:bg-[#05b34b] text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                <span className="text-xs sm:text-sm truncate">LINE でシェア</span>
              </Button>
            </div>
          </div>

          {/* ヒント */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-[#1E40AF] leading-relaxed">
              💡 シェアすると、この投稿がより多くの人に届きます
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
