"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UsernameRegistrationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentUsername?: string
  onSave: (username: string) => Promise<void>
}

export function UsernameRegistrationModal({
  isOpen,
  onOpenChange,
  currentUsername,
  onSave,
}: UsernameRegistrationModalProps) {
  const [username, setUsername] = useState(currentUsername || "")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username.trim()) {
      setError("ユーザー名を入力してください")
      return
    }

    if (username.length < 2) {
      setError("ユーザー名は2文字以上で入力してください")
      return
    }

    if (username.length > 20) {
      setError("ユーザー名は20文字以下で入力してください")
      return
    }

    try {
      await onSave(username.trim())
      onOpenChange(false)
      setUsername("")
    } catch (error) {
      console.error("❌ [UsernameModal] Save error:", error)
      setError(error instanceof Error ? error.message : "ユーザー名の登録に失敗しました")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ユーザー名登録</DialogTitle>
          <DialogDescription>表示用のユーザー名を設定してください。いつでも変更できます。</DialogDescription>
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
              maxLength={20}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">登録</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
