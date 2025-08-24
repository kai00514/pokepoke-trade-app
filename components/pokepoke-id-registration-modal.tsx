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
  const [pokepokeId, setPokepokeId] = useState(currentPokepokeId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pokepokeId.trim()) {
      setError("ポケポケIDを入力してください")
      return
    }

    if (pokepokeId.length < 3 || pokepokeId.length > 20) {
      setError("ポケポケIDは3文字以上20文字以下で入力してください")
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
      setError("ポケポケIDの保存に失��しました。もう一度お試しください。")
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ポケポケID登録</DialogTitle>
          <DialogDescription>
            あなたのポケポケIDを設定してください。他のユーザーがあなたを見つけやすくなります。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pokepoke-id" className="text-right">
                ポケポケID
              </Label>
              <Input
                id="pokepoke-id"
                value={pokepokeId}
                onChange={(e) => setPokepokeId(e.target.value)}
                className="col-span-3"
                placeholder="例: trainer123"
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
