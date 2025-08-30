"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Package, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

interface TradeOwnedList {
  id: number
  list_name: string
  card_ids: number[]
  user_id: string
  created_at: string
  updated_at: string
}

interface ListSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (cardIds: number[]) => void
  userId: string
}

export default function ListSelectorModal({ isOpen, onClose, onSelect, userId }: ListSelectorModalProps) {
  const [lists, setLists] = useState<TradeOwnedList[]>([])
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchLists()
    }
  }, [isOpen, userId])

  const fetchLists = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("trade_owned_list")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error fetching lists:", error)
        toast({
          title: "エラー",
          description: "リストの取得に失敗しました。",
          variant: "destructive",
        })
        return
      }

      setLists(data || [])
    } catch (error) {
      console.error("Unexpected error:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = () => {
    if (selectedListId === null) {
      toast({
        title: "エラー",
        description: "リストを選択してください。",
        variant: "destructive",
      })
      return
    }

    const selectedList = lists.find((list) => list.id === selectedListId)
    if (selectedList) {
      onSelect(selectedList.card_ids || [])
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>リストから選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">リストがありません</h3>
              <p className="text-slate-500 mb-4">まずは「譲れるカードリスト」ページでリストを作成してください。</p>
              <Button variant="outline" onClick={onClose}>
                閉じる
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedListId === list.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedListId(list.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">{list.list_name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(list.updated_at)}
                          </div>
                          <Badge variant="secondary">{list.card_ids ? list.card_ids.length : 0}枚</Badge>
                        </div>
                      </div>
                      {selectedListId === list.id && (
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  キャンセル
                </Button>
                <Button onClick={handleSelect} className="bg-blue-600 hover:bg-blue-700">
                  選択したリストを追加
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
