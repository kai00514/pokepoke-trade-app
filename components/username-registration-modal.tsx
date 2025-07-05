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

interface UsernameRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UsernameRegistrationModal({ isOpen, onClose }: UsernameRegistrationModalProps) {
  const { user, refreshUserProfile } = useAuth()
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("ユーザーが認証されていません")
      return
    }

    if (!username.trim()) {
      setError("ユーザー名を入力してください")
      return
    }

    try {
      setError("")

      console.log("🔧 [UsernameModal] Updating display_name:", username)

      await updateUserProfile(user.id, {
        display_name: username.trim(),
      })

      console.log("✅ [UsernameModal] Update successful")

      // プロファイルを再取得
      await refreshUserProfile()

      toast({
        title: "成功",
        description: "ユーザー名が更新されました",
      })

      onClose()
      setUsername("")
    } catch (error) {
      console.error("❌ [UsernameModal] Update failed:", error)
      const errorMessage = error instanceof Error ? error.message : "ユーザー名の更新に失敗しました"
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
          <DialogTitle>ユーザー名変更</DialogTitle>
          <DialogDescription>新しいユーザー名を入力してください。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="新しいユーザー名"
              className="w-full"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">更新</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
