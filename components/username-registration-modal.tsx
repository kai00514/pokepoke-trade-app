"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { updateUserProfile } from "@/lib/services/user-service_ver2"
import { toast } from "sonner"

interface UsernameRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UsernameRegistrationModal({ isOpen, onClose, onSuccess }: UsernameRegistrationModalProps) {
  const [username, setUsername] = useState("")
  const { user, refreshUserProfile } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("ユーザーが見つかりません")
      return
    }

    if (!username.trim()) {
      toast.error("ユーザー名を入力してください")
      return
    }

    try {
      console.log("🚀 [UsernameModal] Starting profile update...")

      await updateUserProfile(user.id, {
        display_name: username.trim(),
      })

      console.log("✅ [UsernameModal] Profile updated successfully")

      // プロファイルを再取得
      await refreshUserProfile()

      toast.success("ユーザー名が登録されました")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("❌ [UsernameModal] Update failed:", error)
      toast.error(error instanceof Error ? error.message : "エラーが発生しました")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ユーザー名を登録</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力"
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
