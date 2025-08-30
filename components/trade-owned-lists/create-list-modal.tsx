"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface CreateListModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreateList: (listName: string) => Promise<void>
}

export default function CreateListModal({ isOpen, onOpenChange, onCreateList }: CreateListModalProps) {
  const [listName, setListName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!listName.trim()) return

    setIsCreating(true)
    try {
      await onCreateList(listName.trim())
      setListName("")
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!isCreating) {
      onOpenChange(open)
      if (!open) {
        setListName("")
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新しいリストを作成</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="listName" className="text-sm font-medium text-gray-700">
              リスト名
            </Label>
            <Input
              id="listName"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="例: 水タイプポケモン、レアカード等"
              className="w-full"
              disabled={isCreating}
              maxLength={50}
            />
            <p className="text-xs text-gray-500">{listName.length}/50文字</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isCreating}>
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!listName.trim() || isCreating}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                "作成"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
