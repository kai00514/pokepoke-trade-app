"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

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

  const handleSave = async () => {
    if (!username.trim()) {
      setError("ユーザー名を入力してください")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🔧 [UsernameModal] Saving username:", username)
      await onSave(username.trim())
      console.log("✅ [UsernameModal] Save completed successfully")
      onOpenChange(false)
      setUsername("")
    } catch (error) {
      console.error("❌ [UsernameModal] Save failed:", error)
      setError(error instanceof Error ? error.message : "保存に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setUsername(currentUsername || "")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ユーザー名登録</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力してください"
              disabled={isLoading}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
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
      </DialogContent>
    </Dialog>
  )
}
