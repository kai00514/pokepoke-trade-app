"use client"

import type React from "react"

import { useState, useEffect } from "react" // useEffectを追加
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog" // DialogDescriptionを追加
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { updateUserProfile } from "@/lib/services/user-service_ver2" // updateUserProfileをインポート
import { toast } from "sonner"

interface PokepokeIdRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentPokepokeId?: string // currentPokepokeIdを追加
}

export function PokepokeIdRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  currentPokepokeId,
}: PokepokeIdRegistrationModalProps) {
  const [pokepokeId, setPokepokeId] = useState(currentPokepokeId || "") // currentPokepokeIdを初期値に設定
  const { user, refreshUserProfile } = useAuth()

  // モーダルが開かれたときに現在のIDをセット
  useEffect(() => {
    if (isOpen) {
      setPokepokeId(currentPokepokeId || "")
    }
  }, [isOpen, currentPokepokeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("ユーザーが見つかりません")
      return
    }

    if (!pokepokeId.trim()) {
      toast.error("ポケポケIDを入力してください")
      return
    }

    try {
      console.log("🚀 [PokepokeIdModal] Starting profile update for Pokepoke ID:", pokepokeId)

      await updateUserProfile(user.id, {
        pokepoke_id: pokepokeId.trim(),
      })

      console.log("✅ [PokepokeIdModal] Pokepoke ID updated successfully")

      // プロファイルを再取得
      await refreshUserProfile()

      toast.success("ポケポケIDが登録されました")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("❌ [PokepokeIdModal] Update failed:", error)
      toast.error(error instanceof Error ? error.message : "エラーが発生しました")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ポケポケIDを登録</DialogTitle>
          <DialogDescription>
            あなたのポケポケIDを入力してください。これは他のユーザーとのトレードや交流に使用されます。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pokepoke-id">ポケポケID</Label>
            <Input
              id="pokepoke-id"
              type="text"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              placeholder="例: 1234-5678-9012"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">登録</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
