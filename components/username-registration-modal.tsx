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
import { User } from "lucide-react"
import { useTranslations } from "next-intl"

interface UsernameRegistrationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentUsername?: string
  onSave: (username: string) => Promise<void>
}

export function UsernameRegistrationModal({
  isOpen,
  onOpenChange,
  currentUsername,
  onSave,
}: UsernameRegistrationModalProps) {
  const t = useTranslations()
  const [username, setUsername] = useState(currentUsername || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError(t("errors.validation.enterUsername"))
      return
    }

    if (username.length < 1 || username.length > 30) {
      setError(t("errors.validation.usernameLength"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave(username.trim())
      onOpenChange(false)
      setUsername("")
    } catch (error) {
      console.error("ユーザー名保存エラー:", error)
      setError(t("errors.username.saveFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setUsername(currentUsername || "")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 to-violet-50 border-blue-200">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">{t("messages.modals.username.title")}</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {t("messages.modals.username.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                {t("forms.username.label")}
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("forms.username.placeholder")}
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
