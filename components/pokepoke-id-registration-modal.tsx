"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { updateUserProfile } from "@/lib/services/user-service_ver2" // 新しいバージョンを使用

export function PokepokeIdRegistrationModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user, userProfile, refreshSession } = useAuth()
  const [pokepokeId, setPokepokeId] = useState(userProfile?.pokepoke_id || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("ユーザーが認証されていません。")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      console.log("🔧 [PokepokeIdModal] Submitting pokepoke_id:", pokepokeId)
      console.log("🔧 [PokepokeIdModal] User ID:", user.id)

      const result = await updateUserProfile(user.id, {
        pokepoke_id: pokepokeId,
      })

      console.log("🔧 [PokepokeIdModal] Update result:", result)

      if (!result) {
        throw new Error("プロフィールの更新に失敗しました。")
      }

      // セッション情報を更新
      await refreshSession()

      // モーダルを閉じる
      onOpenChange(false)
    } catch (err) {
      console.error("❌ [PokepokeIdModal] Error:", err)
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ポケポケIDの登録</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pokepoke-id">ポケポケID</Label>
            <Input
              id="pokepoke-id"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              placeholder="例: 1234-5678-9012"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "登録中..." : "登録する"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
