"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserProfile } from "@/lib/services/user-service_ver2"
import { useAuth } from "@/contexts/auth-context"

interface PokepokeIdRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PokepokeIdRegistrationModal({ isOpen, onClose, onSuccess }: PokepokeIdRegistrationModalProps) {
  const [pokepokeId, setPokepokeId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleSave = async () => {
    console.log("🚀 [handlePokepokeIdSave] ===== START =====")
    console.log("🚀 [handlePokepokeIdSave] Input pokepokeId:", pokepokeId)

    if (!pokepokeId.trim()) {
      setError("PokepokeIDを入力してください")
      return
    }

    if (!user?.id) {
      setError("ユーザー情報が取得できません")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🔄 [handlePokepokeIdSave] Calling updateUserProfile...")

      const result = await updateUserProfile(user.id, {
        pokepoke_id: pokepokeId.trim(),
      })

      console.log("✅ [handlePokepokeIdSave] Update successful:", result)

      if (onSuccess) {
        onSuccess()
      }

      onClose()
      setPokepokeId("")
    } catch (error) {
      console.error("❌ [handlePokepokeIdSave] Update failed:", error)
      setError("PokepokeIDの保存に失敗しました。もう一度お試しください。")
    } finally {
      setIsLoading(false)
      console.log("🏁 [handlePokepokeIdSave] ===== END =====")
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setPokepokeId("")
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>PokepokeIDを設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pokepoke-id">PokepokeID</Label>
            <Input
              id="pokepoke-id"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              placeholder="PokepokeIDを入力"
              disabled={isLoading}
              maxLength={20}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !pokepokeId.trim()}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
