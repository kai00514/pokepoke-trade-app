"use client"

import type React from "react"

import { useState } from "react"
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
  const [pokepokeId, setPokepokeId] = useState(currentPokepokeId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pokepokeId.trim()) {
      setError("ポケポケIDを入力してください")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onSave(pokepokeId.trim())
      onOpenChange(false)
      setPokepokeId("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "保存に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ポケポケID登録</DialogTitle>
          <DialogDescription>ポケポケIDを登録してください。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pokepoke-id">ポケポケID</Label>
            <Input
              id="pokepoke-id"
              type="text"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              placeholder="ポケポケIDを入力"
              disabled={isLoading}
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
