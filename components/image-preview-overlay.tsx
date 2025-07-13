"use client"

import Image from "next/image"

interface ImagePreviewOverlayProps {
  isOpen: boolean
  imageUrl: string | null
  cardName?: string
  onClose: () => void
  onClick?: () => void
}

export default function ImagePreviewOverlay({
  isOpen,
  imageUrl,
  cardName,
  onClose,
  onClick,
}: ImagePreviewOverlayProps) {
  if (!isOpen) return null

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="relative w-[90vw] h-[90vh] max-w-[800px] max-h-[600px]">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={cardName || "Card preview"}
          fill
          className="object-contain cursor-pointer"
          onClick={onClick}
          sizes="90vw"
        />
        <button className="absolute top-4 right-4 text-white text-2xl cursor-pointer" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>
  )
}
