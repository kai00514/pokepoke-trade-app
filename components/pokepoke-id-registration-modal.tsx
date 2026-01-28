"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Hash } from "lucide-react"
import { useTranslations } from "next-intl"

interface PokepokeIdRegistrationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentPokepokeId?: string
  onSave: (pokepokeId: string) => Promise<void>
}

export function PokepokeIdRegistrationModal({
  isOpen,
  onOpenChange,
  currentPokepokeId,
  onSave,
}: PokepokeIdRegistrationModalProps) {
  const t = useTranslations()
  const [pokepokeId, setPokepokeId] = useState(currentPokepokeId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pokepokeId.trim()) {
      setError(t("errors.validation.enterPokepokeId"))
      return
    }

    if (pokepokeId.length < 3 || pokepokeId.length > 20) {
      setError(t("errors.validation.pokepokeIdLength"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave(pokepokeId.trim())
      onOpenChange(false)
      setPokepokeId("")
    } catch (error) {
      console.error("ポケポケID保存エラー:", error)
      setError(t("errors.pokepokeId.saveFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setPokepokeId(currentPokepokeId || "")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 to-violet-50 border-blue-200">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Hash className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">{t("messages.modals.pokepokeId.title")}</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {t("messages.modals.pokepokeId.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pokepoke-id" className="text-sm font-medium text-gray-700">
                {t("forms.pokepokeId.label")}
              </Label>
              <Input
                id="pokepoke-id"
                value={pokepokeId}
                onChange={(e) => setPokepokeId(e.target.value)}
                placeholder={t("forms.pokepokeId.placeholder")}
                disabled={isLoading}
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
            >
              {t("common.buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? t("common.buttons.saving") : t("common.buttons.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
