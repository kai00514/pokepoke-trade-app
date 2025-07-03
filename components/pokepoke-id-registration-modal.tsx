"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { updateUserProfile } from "@/lib/services/user-service_ver2"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface PokepokeIdRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PokepokeIdRegistrationModal({ isOpen, onClose }: PokepokeIdRegistrationModalProps) {
  const { user, refreshUserProfile } = useAuth()
  const [pokepokeId, setPokepokeId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!user) {
      toast.error("ログインしていません。")
      return
    }
    if (!pokepokeId.trim()) {
      setError("ポケポケIDを入力してください。")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      console.log("🚀 [handlePokepokeIdSave] Calling updateUserProfile...")
      const updatedProfile = await updateUserProfile(user.id, { pokepoke_id: pokepokeId })
      console.log("✅ [handlePokepokeIdSave] Profile updated:", updatedProfile)

      toast.success("ポケポケIDを登録しました！")
      await refreshUserProfile() // Refresh user profile in context
      onClose()
    } catch (err) {
      console.error("❌ [handlePokepokeIdSave] Failed to update Pokepoke ID:", err)
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。"
      setError(errorMessage)
      toast.error(`登録に失敗しました: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setPokepokeId("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ポケポケID登録</DialogTitle>
          <DialogDescription>ゲーム内のトレーナーIDを登録してください。</DialogDescription>
        </DialogHeader>
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
              placeholder="例: 1234-5678-9012"
            />
          </div>
          {error && <p className="text-red-500 text-sm col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "登録中..." : "登録"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
