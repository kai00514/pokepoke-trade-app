"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Package, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

interface TradeOwnedList {
  id: number
  name: string
  card_ids: number[]
  updated_at: string
}

interface ListSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (cardIds: number[]) => void
}

export default function ListSelectorModal({ isOpen, onClose, onSelect }: ListSelectorModalProps) {
  const { user } = useAuth()
  const [lists, setLists] = useState<TradeOwnedList[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedListId, setSelectedListId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      fetchLists()
    }
  }, [isOpen, user])

  const fetchLists = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("trade_owned_list")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error fetching lists:", error)
        return
      }

      setLists(data || [])
    } catch (error) {
      console.error("Unexpected error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectList = (list: TradeOwnedList) => {
    setSelectedListId(list.id)
  }

  const handleConfirm = () => {
    const selectedList = lists.find((list) => list.id === selectedListId)
    if (selectedList) {
      onSelect(selectedList.card_ids)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>リストから選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : lists.length > 0 ? (
            <>
              <div className="space-y-3">
                {lists.map((list) => (
                  <Card
                    key={list.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedListId === list.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => handleSelectList(list)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800">{list.name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {list.card_ids.length}枚
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(list.updated_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">リスト</Badge>
                          {selectedListId === list.id && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  キャンセル
                </Button>
                <Button onClick={handleConfirm} disabled={!selectedListId} className="bg-blue-600 hover:bg-blue-700">
                  選択したリストを追加
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">リストがありません</h3>
              <p className="text-slate-500 mb-4">まずは「譲れるカードリスト」ページでリストを作成してください。</p>
              <Button variant="outline" onClick={onClose}>
                閉じる
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
