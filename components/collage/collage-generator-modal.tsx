"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DetailedSearchModal from "@/components/detailed-search-modal"
import type { Card } from "@/components/detailed-search-modal"
import { ChevronRight, Loader2 } from "lucide-react"

interface CollageGeneratorModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export default function CollageGeneratorModal({ isOpen, onOpenChange }: CollageGeneratorModalProps) {
  const [step, setStep] = useState<"input" | "select1" | "select2" | "preview">("input")
  const [title1, setTitle1] = useState("求めるカード")
  const [title2, setTitle2] = useState("譲れるカード")
  const [selectedCards1, setSelectedCards1] = useState<Card[]>([])
  const [selectedCards2, setSelectedCards2] = useState<Card[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [currentSearchGroup, setCurrentSearchGroup] = useState<1 | 2>(1)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleClose = () => {
    setStep("input")
    setTitle1("求めるカード")
    setTitle2("譲れるカード")
    setSelectedCards1([])
    setSelectedCards2([])
    setCurrentSearchGroup(1)
    onOpenChange(false)
  }

  const handleStartSelection = () => {
    if (!title1.trim() || !title2.trim()) {
      alert("タイトルを入力してください")
      return
    }
    setStep("select1")
  }

  const handleSelectGroup1Complete = (cards: Card[]) => {
    setSelectedCards1(cards)
    setIsSearchModalOpen(false)
    setStep("select2")
  }

  const handleSelectGroup2Complete = (cards: Card[]) => {
    setSelectedCards2(cards)
    setIsSearchModalOpen(false)
    setStep("preview")
  }

  const handleEditGroup1 = () => {
    setCurrentSearchGroup(1)
    setIsSearchModalOpen(true)
  }

  const handleEditGroup2 = () => {
    setCurrentSearchGroup(2)
    setIsSearchModalOpen(true)
  }

  const handlePreviewSearch = (cards: Card[]) => {
    if (currentSearchGroup === 1) {
      handleSelectGroup1Complete(cards)
    } else {
      handleSelectGroup2Complete(cards)
    }
  }

  const handleGenerateCollage = async () => {
    if (selectedCards1.length === 0 && selectedCards2.length === 0) {
      alert("少なくとも1つのグループでカードを選択してください")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/collages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title1,
          card_ids_1: selectedCards1.map((c) => Number.parseInt(c.id)),
          title2,
          card_ids_2: selectedCards2.map((c) => Number.parseInt(c.id)),
        }),
      })

      if (!response.ok) {
        throw new Error("コラージュ生成に失敗しました")
      }

      const data = await response.json()
      window.location.href = `/collages/${data.id}`
    } catch (error) {
      console.error("Error generating collage:", error)
      alert("コラージュ生成に失敗しました")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>コラージュ画像を生成</DialogTitle>
          </DialogHeader>

          {step === "input" && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title1">グループ1のタイトル</Label>
                <Input
                  id="title1"
                  value={title1}
                  onChange={(e) => setTitle1(e.target.value)}
                  placeholder="例: 求めるカード"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title2">グループ2のタイトル</Label>
                <Input
                  id="title2"
                  value={title2}
                  onChange={(e) => setTitle2(e.target.value)}
                  placeholder="例: 譲れるカード"
                  className="text-base"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  各グループで1～30枚のカードを選択できます。タイトルはコラージュ画像に表示されます。
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => handleClose()}>
                  キャンセル
                </Button>
                <Button onClick={handleStartSelection} className="bg-blue-600 hover:bg-blue-700 text-white">
                  次へ
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === "select1" && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{title1}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedCards1.length > 0
                    ? `${selectedCards1.length}枚のカードが選択されています`
                    : "カードを選択してください"}
                </p>
              </div>

              {selectedCards1.length > 0 && (
                <div className="grid grid-cols-6 gap-2 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  {selectedCards1.map((card) => (
                    <div key={card.id} className="aspect-[5/7] bg-white rounded border">
                      <img
                        src={card.imageUrl || "/placeholder.svg"}
                        alt={card.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep("input")}>
                  戻る
                </Button>
                <Button
                  onClick={() => {
                    setCurrentSearchGroup(1)
                    setIsSearchModalOpen(true)
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  カードを選択
                </Button>
              </div>
            </div>
          )}

          {step === "select2" && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{title2}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedCards2.length > 0
                    ? `${selectedCards2.length}枚のカードが選択されています`
                    : "カードを選択してください"}
                </p>
              </div>

              {selectedCards2.length > 0 && (
                <div className="grid grid-cols-6 gap-2 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  {selectedCards2.map((card) => (
                    <div key={card.id} className="aspect-[5/7] bg-white rounded border">
                      <img
                        src={card.imageUrl || "/placeholder.svg"}
                        alt={card.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep("select1")}>
                  戻る
                </Button>
                <Button
                  onClick={() => {
                    setCurrentSearchGroup(2)
                    setIsSearchModalOpen(true)
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  カードを選択
                </Button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-100 rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <p className="font-semibold text-sm mb-2">{title1}</p>
                  {selectedCards1.length > 0 ? (
                    <div className="grid grid-cols-6 gap-2">
                      {selectedCards1.map((card) => (
                        <img
                          key={card.id}
                          src={card.imageUrl || "/placeholder.svg"}
                          alt={card.name}
                          className="w-full aspect-[5/7] object-cover rounded"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">カード未選択</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <p className="font-semibold text-sm mb-2">{title2}</p>
                  {selectedCards2.length > 0 ? (
                    <div className="grid grid-cols-6 gap-2">
                      {selectedCards2.map((card) => (
                        <img
                          key={card.id}
                          src={card.imageUrl || "/placeholder.svg"}
                          alt={card.name}
                          className="w-full aspect-[5/7] object-cover rounded"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">カード未選択</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                <Button size="sm" variant="outline" onClick={() => handleEditGroup1()}>
                  {title1}を編集
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEditGroup2()}>
                  {title2}を編集
                </Button>
              </div>

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep("select2")}>
                  戻る
                </Button>
                <Button
                  onClick={handleGenerateCollage}
                  disabled={isGenerating || (selectedCards1.length === 0 && selectedCards2.length === 0)}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    "コラージュ画像を生成"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onSelectionComplete={handlePreviewSearch}
        maxSelection={30}
        initialSelectedCards={currentSearchGroup === 1 ? selectedCards1 : selectedCards2}
        modalTitle={`${currentSearchGroup === 1 ? title1 : title2}のカードを選択`}
      />
    </>
  )
}
