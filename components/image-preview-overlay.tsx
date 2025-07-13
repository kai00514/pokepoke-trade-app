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
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const handleImageContainerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const handleCloseButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[99999] p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
      style={{
        pointerEvents: "auto",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div className="relative w-auto h-auto max-w-[90vw] max-h-[90vh]" onClick={handleImageContainerClick}>
        <h2 id="image-preview-title" className="sr-only">
          {cardName} - Image Preview
        </h2>
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={cardName}
          width={600}
          height={840}
          className="object-contain rounded-lg shadow-2xl cursor-pointer"
          style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "100%" }}
          unoptimized
          onClick={handleImageClick}
        />
        <button
          onClick={handleCloseButtonClick}
          className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-slate-800/70 hover:bg-slate-700/90 text-white rounded-full p-1.5 shadow-lg transition-colors z-10"
          aria-label="Close image preview"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
