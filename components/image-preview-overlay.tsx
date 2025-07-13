"use client"

import type React from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { useEffect } from "react"

interface ImagePreviewOverlayProps {
  isOpen: boolean
  imageUrl: string | null
  cardName?: string
  onClose: () => void
}

export default function ImagePreviewOverlay({
  isOpen,
  imageUrl,
  cardName = "Card Preview",
  onClose,
}: ImagePreviewOverlayProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-4"
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
      }}
    >
      <div className="relative w-auto h-auto max-w-[90vw] max-h-[90vh]">
        <h2 id="image-preview-title" className="sr-only">
          {cardName} - Image Preview
        </h2>
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={cardName}
          width={600}
          height={840}
          className="object-contain rounded-lg shadow-2xl cursor-pointer"
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          unoptimized
          onClick={handleImageClick}
          priority
        />
        <button
          onClick={handleCloseClick}
          className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-slate-800/70 hover:bg-slate-700/90 text-white rounded-full p-1.5 shadow-lg transition-colors z-10"
          aria-label="Close image preview"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
