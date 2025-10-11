"use client"

import type React from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { useEffect } from "react"
import { createPortal } from "react-dom"
import { event as gtagEvent } from "@/lib/analytics/gtag"

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

    gtagEvent("image_preview_opened", {
      category: "engagement",
      image_type: "card",
      card_name: cardName,
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose, cardName])

  if (!isOpen || !imageUrl) return null

  const handleBackgroundClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const overlayContent = (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
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
        zIndex: 2147483647,
        isolation: "isolate",
      }}
    >
      <div
        className="relative w-auto h-auto max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-200"
        style={{
          zIndex: 2147483647,
          isolation: "isolate",
        }}
      >
        <h2 id="image-preview-title" className="sr-only">
          {cardName} - Image Preview
        </h2>
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={cardName}
          width={600}
          height={840}
          className="object-contain rounded-lg shadow-2xl cursor-pointer transition-transform hover:scale-[1.02]"
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
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-full p-2 shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label="Close image preview"
          type="button"
          style={{
            zIndex: 2147483647,
            isolation: "isolate",
            pointerEvents: "auto",
            touchAction: "manipulation",
          }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )

  return typeof document !== "undefined" ? createPortal(overlayContent, document.body) : null
}
