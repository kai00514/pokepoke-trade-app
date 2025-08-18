"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError("ユーザー名を入力してください")
      return
    }

    if (username.length < 1 || username.length > 30) {
      setError("ユーザー名は1文字以上30文字以下で入力してください")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave(username.trim())
      onOpenChange(false)
      setUsername("")
    } catch (error) {
      console.error("ユーザー名保存エラー:", error)
      setError("ユーザー名の保存に失敗しました。もう一度お試しください。")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setUsername(currentUsername || "")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ユーザー名登録</DialogTitle>
          <DialogDescription>表示用のユーザー名を設定してください。いつでも変更できます。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
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
                placeholder="例: ポケモントレーナー"
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
