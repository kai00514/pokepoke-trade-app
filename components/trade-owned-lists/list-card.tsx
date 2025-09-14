"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Edit, Trash2, Calendar, CreditCard } from "lucide-react"

interface OwnedList {
  id: number
  list_name: string
  card_ids: number[]
  created_at: string
  updated_at: string
}

interface ListCardProps {
  list: OwnedList
  onEdit: () => void
  onDelete: () => void
}

export default function ListCard({ list, onEdit, onDelete }: ListCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const cardCount = list.card_ids.length
  const progressPercentage = (cardCount / 35) * 100

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-800 text-lg truncate flex-1 mr-2">{list.list_name}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
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
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>更新: {formatDate(list.updated_at)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCard className="h-4 w-4" />
            <span>カード数: {cardCount}/35枚</span>
            <Badge
              variant={cardCount === 35 ? "default" : "secondary"}
              className={cardCount === 35 ? "bg-green-100 text-green-800" : ""}
            >
              {cardCount === 35 ? "満杯" : `${35 - cardCount}枚追加可能`}
            </Badge>
          </div>

          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-2" />
            <div className="text-xs text-gray-500 text-right">{progressPercentage.toFixed(0)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
