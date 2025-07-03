"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { updateUserProfile } from "@/lib/services/user-service_ver2"
import { useAuth } from "@/contexts/auth-context"

interface UsernameRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UsernameRegistrationModal({ isOpen, onClose, onSuccess }: UsernameRegistrationModalProps) {
  const { user, userProfile } = useAuth()
  const [username, setUsername] = useState(userProfile?.display_name || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  console.log("🎯 [UsernameRegistrationModal] Render:", {
    isOpen,
    user: user ? { id: user.id, email: user.email } : null,
    userProfile,
    currentUsername: username,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("🚀 [UsernameRegistrationModal] Submit started")
    console.log("🚀 [UsernameRegistrationModal] Username:", username)

    if (!user) {
      console.error("❌ [UsernameRegistrationModal] No user found")
      setError("ユーザーが認証されていません")
      return
    }

    if (!username.trim()) {
      console.error("❌ [UsernameRegistrationModal] Empty username")
      setError("ユーザー名を入力してください")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      console.log("🔄 [UsernameRegistrationModal] Calling updateUserProfile...")
      const result = await updateUserProfile(user.id, {
        display_name: username.trim(),
      })

      console.log("✅ [UsernameRegistrationModal] Update successful:", result)
      setSuccess(true)

      // 成功後、少し待ってからモーダルを閉じる
      setTimeout(() => {
        onSuccess()
        onClose()
        setSuccess(false)
      }, 1500)
    } catch (error) {
      console.error("❌ [UsernameRegistrationModal] Update failed:", error)
      setError(error instanceof Error ? error.message : "ユーザー名の保存に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ユーザー名を設定</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力してください"
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">ユーザー名が正常に保存されました！</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading || !username.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
