"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { updateUserProfile } from "@/lib/services/user-service_ver2"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface PokepokeIdRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PokepokeIdRegistrationModal({ isOpen, onClose }: PokepokeIdRegistrationModalProps) {
  const { user, refreshUserProfile } = useAuth()
  const [pokepokeId, setPokepokeId] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("ユーザーが認証されていません")
      return
    }

    if (!pokepokeId.trim()) {
      setError("ポケポケIDを入力してください")
      return
    }

    try {
      setError("")

      console.log("🔧 [PokepokeIdModal] Updating pokepoke_id:", pokepokeId)

      await updateUserProfile(user.id, {
        pokepoke_id: pokepokeId.trim(),
      })

      console.log("✅ [PokepokeIdModal] Update successful")

      // プロファイルを再取得
      await refreshUserProfile()

      toast({
        title: "成功",
        description: "ポケポケIDが登録されました",
      })

      onClose()
      setPokepokeId("")
    } catch (error) {
      console.error("❌ [PokepokeIdModal] Update failed:", error)
      const errorMessage = error instanceof Error ? error.message : "ポケポケIDの登録に失敗しました"
      setError(errorMessage)

      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ポケポケID登録</DialogTitle>
          <DialogDescription>ポケモンカードゲームポケットのIDを登録してください。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pokepoke-id">ポケポケID</Label>
            <Input
              id="pokepoke-id"
              type="text"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              placeholder="例: 1234567890"
              className="w-full"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
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
