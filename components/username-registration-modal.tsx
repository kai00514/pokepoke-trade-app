"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { updateUserProfile } from "@/lib/services/user-service_ver2" // 新しいバージョンを使用

export function UsernameRegistrationModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user, userProfile, refreshSession } = useAuth()
  const [username, setUsername] = useState(userProfile?.display_name || "")
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

      console.log("🔧 [UsernameModal] Submitting display_name:", username)
      console.log("🔧 [UsernameModal] User ID:", user.id)

      const result = await updateUserProfile(user.id, {
        display_name: username,
      })

      console.log("🔧 [UsernameModal] Update result:", result)

      if (!result) {
        throw new Error("プロフィールの更新に失敗しました。")
      }

      // セッション情報を更新
      await refreshSession()

      // モーダルを閉じる
      onOpenChange(false)
    } catch (err) {
      console.error("❌ [UsernameModal] Error:", err)
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ユーザー名の登録</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="例: ポケモントレーナー"
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
