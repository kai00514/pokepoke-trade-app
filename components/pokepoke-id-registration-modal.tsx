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

interface PokepokeIdRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PokepokeIdRegistrationModal({ isOpen, onClose, onSuccess }: PokepokeIdRegistrationModalProps) {
  const { user, userProfile } = useAuth()
  const [pokepokeId, setPokepokeId] = useState(userProfile?.pokepoke_id || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  console.log("🎯 [PokepokeIdRegistrationModal] Render:", {
    isOpen,
    user: user ? { id: user.id, email: user.email } : null,
    userProfile,
    currentPokepokeId: pokepokeId,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("🚀 [PokepokeIdRegistrationModal] Submit started")
    console.log("🚀 [PokepokeIdRegistrationModal] PokepokeId:", pokepokeId)

    if (!user) {
      console.error("❌ [PokepokeIdRegistrationModal] No user found")
      setError("ユーザーが認証されていません")
      return
    }

    if (!pokepokeId.trim()) {
      console.error("❌ [PokepokeIdRegistrationModal] Empty pokepokeId")
      setError("ポケポケIDを入力してください")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      console.log("🔄 [PokepokeIdRegistrationModal] Calling updateUserProfile...")
      const result = await updateUserProfile(user.id, {
        pokepoke_id: pokepokeId.trim(),
      })

      console.log("✅ [PokepokeIdRegistrationModal] Update successful:", result)
      setSuccess(true)

      // 成功後、少し待ってからモーダルを閉じる
      setTimeout(() => {
        onSuccess()
        onClose()
        setSuccess(false)
      }, 1500)
    } catch (error) {
      console.error("❌ [PokepokeIdRegistrationModal] Update failed:", error)
      setError(error instanceof Error ? error.message : "ポケポケIDの保存に失敗しました")
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
          <DialogTitle>ポケポケIDを設定</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pokepoke-id">ポケポケID</Label>
            <Input
              id="pokepoke-id"
              type="text"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              placeholder="ポケポケIDを入力してください"
              disabled={isLoading}
              maxLength={20}
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
              <AlertDescription className="text-green-800">ポケポケIDが正常に保存されました！</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading || !pokepokeId.trim()}>
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
