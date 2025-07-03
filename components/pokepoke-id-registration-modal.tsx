"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface PokepokeIdRegistrationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentPokepokeId?: string
  onSave: (pokepokeId: string) => Promise<void>
}

export function PokepokeIdRegistrationModal({
  isOpen,
  onOpenChange,
  currentPokepokeId,
  onSave,
}: PokepokeIdRegistrationModalProps) {
  const { user } = useAuth()
  const [pokepokeId, setPokepokeId] = useState(currentPokepokeId || "")
  const [isLoading, setIsLoading] = useState(false)

  console.log("🔍 [PokepokeIdModal] Component render:", {
    isOpen,
    hasUser: !!user,
    userId: user?.id,
    currentPokepokeId,
    inputPokepokeId: pokepokeId,
    isLoading,
  })

  const handleSave = async () => {
    console.log("🚀 [PokepokeIdModal] ===== handleSave START =====")
    console.log("🚀 [PokepokeIdModal] Input pokepokeId:", pokepokeId)
    console.log("🚀 [PokepokeIdModal] Current user:", user?.id)

    if (!pokepokeId.trim()) {
      console.warn("⚠️ [PokepokeIdModal] Empty PokepokeID")
      toast.error("ポケポケIDを入力してください")
      return
    }

    if (!user) {
      console.error("❌ [PokepokeIdModal] No user found")
      toast.error("ユーザーが認証されていません")
      return
    }

    setIsLoading(true)
    console.log("🔄 [PokepokeIdModal] Setting loading state to true")

    try {
      console.log("🔄 [PokepokeIdModal] Calling onSave prop function...")
      await onSave(pokepokeId.trim())
      console.log("✅ [PokepokeIdModal] onSave completed successfully")

      toast.success("ポケポケIDが登録されました")
      console.log("✅ [PokepokeIdModal] Success toast shown")

      onOpenChange(false)
      console.log("✅ [PokepokeIdModal] Modal closed")
    } catch (error) {
      console.error("❌ [PokepokeIdModal] Error in handleSave:", error)
      console.error("❌ [PokepokeIdModal] Error details:", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : "No stack trace",
      })
      toast.error(error instanceof Error ? error.message : "ポケポケIDの登録に失敗しました")
    } finally {
      setIsLoading(false)
      console.log("🔄 [PokepokeIdModal] Setting loading state to false")
    }

    console.log("🚀 [PokepokeIdModal] ===== handleSave END =====")
  }

  const handleCancel = () => {
    console.log("🚪 [PokepokeIdModal] Cancel button clicked")
    setPokepokeId(currentPokepokeId || "")
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ポケポケID登録</DialogTitle>
          <DialogDescription>
            あなたのポケポケIDを登録してください。他のユーザーがあなたを見つけやすくなります。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pokepoke-id">ポケポケID</Label>
            <Input
              id="pokepoke-id"
              value={pokepokeId}
              onChange={(e) => {
                console.log("🔄 [PokepokeIdModal] Input changed:", e.target.value)
                setPokepokeId(e.target.value)
              }}
              placeholder="例: trainer123"
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "登録中..." : "登録"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
