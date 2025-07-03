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

interface UsernameRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UsernameRegistrationModal({ isOpen, onClose }: UsernameRegistrationModalProps) {
  const { user, refreshUserProfile } = useAuth()
  const [username, setUsername] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!user) {
      toast.error("ログインしていません。")
      return
    }
    if (!username.trim()) {
      setError("ユーザー名を入力してください。")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      console.log("🚀 [handleUsernameSave] Calling updateUserProfile...")
      const updatedProfile = await updateUserProfile(user.id, { display_name: username })
      console.log("✅ [handleUsernameSave] Profile updated:", updatedProfile)

      toast.success("ユーザー名を更新しました！")
      await refreshUserProfile() // Refresh user profile in context
      onClose()
    } catch (err) {
      console.error("❌ [handleUsernameSave] Failed to update username:", err)
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。"
      setError(errorMessage)
      toast.error(`更新に失敗しました: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setUsername("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ユーザー名登録</DialogTitle>
          <DialogDescription>他のユーザーに表示されるユーザー名を設定してください。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              ユーザー名
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
              placeholder="例: ポケトレマスター"
            />
          </div>
          {error && <p className="text-red-500 text-sm col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
