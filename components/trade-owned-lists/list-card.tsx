"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { Edit, Trash2, Calendar, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { deleteTradeOwnedList, type TradeOwnedList } from "@/lib/actions/trade-owned-lists"
import ListEditorModal from "./list-editor-modal"

interface ListCardProps {
  list: TradeOwnedList
  userId: string
  onUpdate: (updatedList: TradeOwnedList) => void
  onDelete: (deletedListId: number) => void
}

export default function ListCard({ list, userId, onUpdate, onDelete }: ListCardProps) {
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteTradeOwnedList(list.id, userId)

    if (result.success) {
      onDelete(list.id)
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsDeleting(false)
  }

  const handleUpdate = (updatedList: TradeOwnedList) => {
    onUpdate(updatedList)
    setIsEditorModalOpen(false)
  }

  const cardCount = list.card_ids.length
  const maxCards = 35
  const progressPercentage = (cardCount / maxCards) * 100

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                {list.list_name}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(list.updated_at)}</span>
              </div>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditorModalOpen(true)}
                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>リストを削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      「{list.list_name}」を削除します。この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "削除中..." : "削除"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">カード枚数</span>
              </div>
              <Badge
                variant={cardCount === maxCards ? "destructive" : cardCount > 25 ? "secondary" : "default"}
                className="font-medium"
              >
                {cardCount} / {maxCards}
              </Badge>
            </div>
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{cardCount === 0 ? "カードなし" : `${cardCount}枚登録済み`}</span>
                <span>{maxCards - cardCount}枚追加可能</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ListEditorModal
        isOpen={isEditorModalOpen}
        onOpenChange={setIsEditorModalOpen}
        list={list}
        userId={userId}
        onSuccess={handleUpdate}
      />
    </>
  )
}
