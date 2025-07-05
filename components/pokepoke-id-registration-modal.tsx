"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [pokepokeId, setPokepokeId] = useState("")
  const [error, setError] = useState("")

  // モーダルが開かれたときに現在のIDをセット
  useEffect(() => {
    if (isOpen) {
      setPokepokeId(currentPokepokeId || "")
      setError("")
    }
  }, [isOpen, currentPokepokeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!pokepokeId.trim()) {
      setError("ポケポケIDを入力してください")
      return
    }

    if (!/^\d{13}$/.test(pokepokeId.trim())) {
      setError("ポケポケIDは13桁の数字で入力してください")
      return
    }

    try {
      await onSave(pokepokeId.trim())
      onOpenChange(false)
    } catch (error) {
      console.error("❌ [PokepokeIdModal] Save error:", error)
      setError(error instanceof Error ? error.message : "ポケポケIDの登録に失敗しました")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ポケポケID登録</DialogTitle>
          <DialogDescription>ポケモンポケットのプレイヤーIDを入力してください。13桁の数字です。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pokepoke-id">ポケポケID</Label>
            <Input
              id="pokepoke-id"
              type="text"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              placeholder="1234567890123"
              maxLength={13}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">登録</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
