"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Package, ExternalLink, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { getTradeOwnedListCards } from "@/lib/actions/trade-owned-lists"
import type { Card as SelectedCardType } from "@/components/detailed-search-modal"
import Link from "next/link"

interface List {
  id: number
  name: string
  updated_at: string
  user_id: string
}

interface ListSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectList: (cards: SelectedCardType[]) => void
}

export default function ListSelectorModal({ isOpen, onClose, onSelectList }: ListSelectorModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [isLoadingCards, setIsLoadingCards] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchLists()
    }
  }, [isOpen, user])

  const fetchLists = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data: lists, error } = await supabase
        .from("trade_owned_list")
        .select("*")
        .eq("user_id", user.id)
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

      setLists(lists || [])
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

  const handleSelectList = async (listId: number) => {
    setSelectedListId(listId)
    setIsLoadingCards(true)

    try {
      const result = await getTradeOwnedListCards(listId)

      if (result.success) {
        const cards: SelectedCardType[] = result.cards.map((card) => ({
          id: card.card_id.toString(),
          name: card.card_name,
          imageUrl: card.card_image_url || "/placeholder.svg?width=120&height=160",
        }))

        onSelectList(cards)
        onClose()
      } else {
        toast({
          title: "エラー",
          description: result.error || "カードの取得に失敗しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading list cards:", error)
      toast({
        title: "エラー",
        description: "予期しないエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCards(false)
      setSelectedListId(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>リストを選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">リストがありません</h3>
              <p className="text-slate-500 mb-4">まずは譲れるカードのリストを作成しましょう。</p>
              <Link href="/lists">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  リスト管理画面へ
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lists.map((list) => (
                <Card
                  key={list.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedListId === list.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => handleSelectList(list.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-slate-800 truncate flex-1 mr-2">{list.name}</h3>
                        <Badge variant="secondary">リスト</Badge>
                      </div>

                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(list.updated_at).toLocaleDateString()}
                      </div>

                      {selectedListId === list.id && isLoadingCards && (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                          <span className="text-sm text-blue-600">読み込み中...</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
