"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner" // sonnerをインポート

interface PokepokeIdRegistrationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void // DialogのonOpenChangeに合わせる
  currentPokepokeId?: string
  onSave: (pokepokeId: string) => Promise<void> // 保存処理を親から受け取る
}

export function PokepokeIdRegistrationModal({
  isOpen,
  onOpenChange,
  currentPokepokeId,
  onSave,
}: PokepokeIdRegistrationModalProps) {
  const { user } = useAuth() // refreshUserProfileはAuthContextに存在しないため削除
  const [inputPokepokeId, setInputPokepokeId] = useState(currentPokepokeId || "")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // モーダルが開かれたときに現在のIDをセット
    if (isOpen) {
      setInputPokepokeId(currentPokepokeId || "")
    }
  }, [isOpen, currentPokepokeId])

  // デバッグログを追加
  useEffect(() => {
    console.log("🔍 [PokepokeIdModal] Component render:", {
      isOpen,
      hasUser: !!user,
      userId: user?.id,
      currentPokepokeId,
      inputPokepokeId,
      isLoading,
    })
  }, [isOpen, user, currentPokepokeId, inputPokepokeId, isLoading])

  const handleSave = async () => {
    if (!user) {
      toast.error("エラー", { description: "認証されていません。再度ログインしてください。" })
      return
    }
    if (!inputPokepokeId.trim()) {
      toast.error("エラー", { description: "Pokepoke IDは必須です。" })
      return
    }

    setIsLoading(true)
    try {
      await onSave(inputPokepokeId) // 親コンポーネントのonSaveを呼び出す
      toast.success("成功", { description: "Pokepoke IDが登録されました！" })
      onOpenChange(false) // 成功したらモーダルを閉じる
    } catch (error) {
      console.error("❌ [PokepokeIdModal] Failed to save Pokepoke ID:", error)
      toast.error("登録失敗", {
        description: error instanceof Error ? error.message : "Pokepoke IDの登録に失敗しました。",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pokepoke IDを登録</DialogTitle>
          <DialogDescription>
            あなたのPokepoke IDを入力してください。これは他のユーザーとのトレードや交流に使用されます。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pokepoke-id" className="text-right">
              Pokepoke ID
            </Label>
            <Input
              id="pokepoke-id"
              value={inputPokepokeId}
              onChange={(e) => setInputPokepokeId(e.target.value)}
              className="col-span-3"
              placeholder="例: 1234-5678-9012"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" disabled={isLoading}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "登録中..." : "登録"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
