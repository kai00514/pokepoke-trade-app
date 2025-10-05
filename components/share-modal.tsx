"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Twitter, MessageCircle, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareUrl: string
  title: string
}

export function ShareModal({ open, onOpenChange, shareUrl, title }: ShareModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "✅ リンクをコピーしました",
        description: "URLがクリップボードにコピーされました",
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "❌ コピーに失敗しました",
        description: "もう一度お試しください",
        variant: "destructive",
        duration: 2000,
      })
    }
  }

  const handleTwitterShare = () => {
    const text = `${title} | PokeLink`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, "_blank", "width=550,height=420")
    onOpenChange(false)
  }

  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`
    window.open(lineUrl, "_blank", "width=550,height=420")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#111827] flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            この投稿を共有
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B7280]">お好きな方法で投稿をシェアできます</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* URLコピーボタン */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#374151]">投稿のURL</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] truncate">
                {shareUrl}
              </div>
              <Button
                onClick={handleCopyLink}
                className={`${
                  copied
                    ? "bg-[#10B981] hover:bg-[#059669]"
                    : "bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8]"
                } text-white transition-all duration-200 shadow-md`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    コピー
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* SNS共有ボタン */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#374151]">SNSでシェア</label>
            <div className="grid grid-cols-2 gap-2">
              {/* Xボタン */}
              <Button
                onClick={handleTwitterShare}
                className="w-full bg-[#000000] hover:bg-[#1a1a1a] text-white flex items-center justify-center gap-2 h-12 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Twitter className="h-5 w-5" />
                <span className="font-semibold">X (Twitter)</span>
              </Button>

              {/* LINEボタン */}
              <Button
                onClick={handleLineShare}
                className="w-full bg-[#06C755] hover:bg-[#05b34b] text-white flex items-center justify-center gap-2 h-12 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-semibold">LINE</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg">
          <p className="text-xs text-[#1E40AF] flex items-center gap-1">
            <span className="text-lg">💡</span>
            <span>リンクをコピーして、メールやチャットで共有することもできます</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
