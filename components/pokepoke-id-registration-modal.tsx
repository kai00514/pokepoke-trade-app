"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

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
  const { user } = useAuth()
  const [pokepokeId, setPokepokeId] = useState(currentPokepokeId || "")
  const [isLoading, setIsLoading] = useState(false)

  // currentPokepokeIdが変更されたときに入力値を更新
  useEffect(() => {
    if (currentPokepokeId !== undefined) {
      setPokepokeId(currentPokepokeId || "")
    }
  }, [currentPokepokeId])

  const handleSave = async () => {
    console.log("🚀 [PokepokeIdModal] Saving:", pokepokeId)

    if (!pokepokeId.trim()) {
      toast.error("ポケポケIDを入力してください")
      return
    }

    if (!user) {
      toast.error("ユーザーが認証されていません")
      return
    }

    setIsLoading(true)

    try {
      await onSave(pokepokeId.trim())
      toast.success("ポケポケIDが登録されました")
      onOpenChange(false)
    } catch (error) {
      console.error("❌ [PokepokeIdModal] Error:", error)
      const errorMessage = error instanceof Error ? error.message : "ポケポケIDの登録に失敗しました"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setPokepokeId(currentPokepokeId || "")
    onOpenChange(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      setPokepokeId(currentPokepokeId || "")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ポケポケID登録</DialogTitle>
          <DialogDescription>
            あなたのポケポケIDを登録してください。他のユーザーがあなたを見つけやすくなります。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pokepoke-id">ポケポケID</Label>
            <Input
              id="pokepoke-id"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              placeholder="例: trainer123"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "登録中..." : "登録"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
