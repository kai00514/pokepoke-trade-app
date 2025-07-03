"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserProfile } from "@/lib/services/user-service_ver2"
import { useAuth } from "@/contexts/auth-context"

interface UsernameRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function UsernameRegistrationModal({ isOpen, onClose, onSuccess }: UsernameRegistrationModalProps) {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleSave = async () => {
    console.log("🚀 [handleUsernameSave] ===== START =====")
    console.log("🚀 [handleUsernameSave] Input username:", username)

    if (!username.trim()) {
      setError("ユーザー名を入力してください")
      return
    }

    if (!user?.id) {
      setError("ユーザー情報が取得できません")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🔄 [handleUsernameSave] Calling updateUserProfile...")

      const result = await updateUserProfile(user.id, {
        display_name: username.trim(),
      })

      console.log("✅ [handleUsernameSave] Update successful:", result)

      if (onSuccess) {
        onSuccess()
      }

      onClose()
      setUsername("")
    } catch (error) {
      console.error("❌ [handleUsernameSave] Update failed:", error)
      setError("ユーザー名の保存に失敗しました。もう一度お試しください。")
    } finally {
      setIsLoading(false)
      console.log("🏁 [handleUsernameSave] ===== END =====")
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setUsername("")
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ユーザー名を設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力"
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !username.trim()}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
