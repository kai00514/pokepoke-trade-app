"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

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
  const [pokepokeId, setPokepokeId] = useState(currentPokepokeId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!pokepokeId.trim()) {
      setError("ポケポケIDを入力してください")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🔧 [PokepokeIdModal] Saving PokepokeID:", pokepokeId)
      await onSave(pokepokeId.trim())
      console.log("✅ [PokepokeIdModal] Save completed successfully")
      onOpenChange(false)
      setPokepokeId("")
    } catch (error) {
      console.error("❌ [PokepokeIdModal] Save failed:", error)
      setError(error instanceof Error ? error.message : "保存に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setPokepokeId(currentPokepokeId || "")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ポケポケID登録</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pokepoke-id">ポケポケID</Label>
            <Input
              id="pokepoke-id"
              value={pokepokeId}
              onChange={(e) => setPokepokeId(e.target.value)}
              placeholder="ポケポケIDを入力してください"
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
