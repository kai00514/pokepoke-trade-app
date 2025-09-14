"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import DetailedSearchModal from "@/components/detailed-search-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ListItem {
  card_id: number
  quantity: number
}

interface TradeOwnedList {
  id: string
  name: string
  description?: string
  items: ListItem[]
  created_at: string
  updated_at: string
}

export default function ListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [list, setList] = useState<any | null>(null)
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", description: "" })
  const [selectedCards, setSelectedCards] = useState<{ [key: number]: number }>({})
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchListData()
  }, [params.id])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchListData = async () => {
    try {
      const { data: listData, error: listError } = await supabase
        .from("trade_owned_lists")
        .select("*")
        .eq("id", params.id)
        .single()

      if (listError) throw listError

      setList(listData)
      setEditForm({ name: listData.name, description: listData.description || "" })

      if (listData.items && listData.items.length > 0) {
        const cardIds = listData.items.map((item: any) => item.card_id)
        const { data: cardsData, error: cardsError } = await supabase
          .from("cards")
          .select("id, name, game8_image_url, rarity, type")
          .in("id", cardIds)

        if (cardsError) throw cardsError

        setCards(cardsData || [])

        // 現在のカード選択状態を設定
        const currentSelection: { [key: number]: number } = {}
        listData.items.forEach((item: any) => {
          currentSelection[item.card_id] = item.quantity
        })
        setSelectedCards(currentSelection)
      }
    } catch (error) {
      console.error("Error fetching list:", error)
      toast({
        title: "リストの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditList = async () => {
    if (!editForm.name.trim()) {
      toast({
        title: "リスト名を入力してください",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("trade_owned_lists")
        .update({
          name: editForm.name,
          description: editForm.description,
        })
        .eq("id", params.id)

      if (error) throw error

      setList((prev) => (prev ? { ...prev, name: editForm.name, description: editForm.description } : null))
      setIsEditModalOpen(false)
      toast({
        title: "リストを更新しました",
      })
    } catch (error) {
      console.error("Error updating list:", error)
      toast({
        title: "リストの更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleDeleteList = async () => {
    try {
      const { error } = await supabase.from("trade_owned_lists").delete().eq("id", params.id)

      if (error) throw error

      toast({
        title: "リストを削除しました",
      })
      router.push("/lists")
    } catch (error) {
      console.error("Error deleting list:", error)
      toast({
        title: "リストの削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCards = async () => {
    try {
      const items = Object.entries(selectedCards)
        .filter(([_, quantity]) => quantity > 0)
        .map(([cardId, quantity]) => ({
          card_id: Number.parseInt(cardId),
          quantity,
        }))

      const { error } = await supabase.from("trade_owned_lists").update({ items }).eq("id", params.id)

      if (error) throw error

      setIsCardModalOpen(false)
      toast({
        title: "カードを更新しました",
      })

      // リストデータを再取得
      await fetchListData()
    } catch (error) {
      console.error("Error updating cards:", error)
      toast({
        title: "カードの更新に失敗しました",
        variant: "destructive",
      })
    }
  }

  const getCardImage = (card: any) => {
    if (card.game8_image_url) {
      return card.game8_image_url
    }
    return "/no-card.png"
  }

  const getCardQuantity = (cardId: number) => {
    const item = list?.items.find((item) => item.card_id === cardId)
    return item?.quantity || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">リストが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/lists")} className="text-blue-600 hover:text-blue-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            リストに戻る
          </Button>

          {user && (
            <div className="flex gap-2">
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    編集
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>リストを編集</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">リスト名</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="リスト名を入力"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">説明</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="説明を入力（任意）"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                        キャンセル
                      </Button>
                      <Button onClick={handleEditList}>更新</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCardModalOpen} onOpenChange={setIsCardModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    カードを追加
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>カードを選択</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden">
                    <DetailedSearchModal
                      isOpen={true}
                      onClose={() => setIsCardModalOpen(false)}
                      selectedCards={selectedCards}
                      onSelectionChange={setSelectedCards}
                      onComplete={handleUpdateCards}
                      showCompleteButton={true}
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>リストを削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。リスト「{list.name}」を完全に削除します。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteList} className="bg-red-600 hover:bg-red-700">
                      削除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* List Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{list.name}</CardTitle>
            {list.description && <p className="text-gray-600">{list.description}</p>}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>カード数: {cards.length}種類</span>
              <span>合計枚数: {list.items.reduce((sum, item) => sum + item.quantity, 0)}枚</span>
            </div>
          </CardContent>
        </Card>

        {/* Cards Grid */}
        {cards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="overflow-hidden">
                <div className="aspect-[3/4] relative">
                  <img
                    src={getCardImage(card) || "/placeholder.svg"}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/no-card.png"
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-blue-600 text-white">
                      {getCardQuantity(card.id)}枚
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">{card.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {card.rarity && (
                      <Badge variant="outline" className="text-xs">
                        {card.rarity}
                      </Badge>
                    )}
                    {card.type && (
                      <Badge variant="outline" className="text-xs">
                        {card.type}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">このリストにはまだカードが追加されていません。</p>
              {user && (
                <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setIsCardModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  カードを追加
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
