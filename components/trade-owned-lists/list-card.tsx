"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface ListCardProps {
  list: {
    id: number
    list_name: string
    card_ids: number[]
    created_at: string
    updated_at: string
  }
  onEdit: () => void
  onDelete: () => void
}

export default function ListCard({ list, onEdit, onDelete }: ListCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">{list.list_name}</CardTitle>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                  disabled={isDeleting}
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
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* カード枚数とプログレス */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="h-4 w-4" />
                <span>カード枚数</span>
              </div>
              <Badge
                variant={cardCount === maxCards ? "destructive" : cardCount > 30 ? "secondary" : "default"}
                className="text-xs"
              >
                {cardCount}/{maxCards}枚
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* 更新日 */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>更新日: {formatDate(list.updated_at)}</span>
          </div>

          {/* 状態表示 */}
          {cardCount === 0 && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">カードが登録されていません</p>
            </div>
          )}

          {cardCount === maxCards && (
            <div className="text-center py-2">
              <Badge variant="secondary" className="text-xs">
                上限達成
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
