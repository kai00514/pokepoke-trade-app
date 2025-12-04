"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import CollageGeneratorModal from "./collage-generator-modal"
import { useTranslations } from "next-intl"

export default function CollageGeneratorButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const t = useTranslations()

  return (
    <>
      <Button
        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        onClick={() => setIsModalOpen(true)}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {t("buttons.generateCollage")}
      </Button>

      <CollageGeneratorModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
