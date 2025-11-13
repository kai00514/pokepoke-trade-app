"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { CollageListItem } from "@/types/collage"

export default function CollageList() {
  const [collages, setCollages] = useState<CollageListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCollages()
  }, [])

  const fetchCollages = async () => {
    try {
      const response = await fetch("/api/collages?limit=50&offset=0")
      if (!response.ok) throw new Error("Failed to fetch collages")

      const result = await response.json()
      if (result.success && result.data) {
        setCollages(result.data.collages)
      } else {
        throw new Error(result.error || "Failed to fetch collages")
      }
    } catch (error) {
      console.error("Error fetching collages:", error)
      toast({
        title: "エラー",
        description: "コラージュ一覧の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("このコラージュを削除しますか？")) return

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/collages/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete collage")

      setCollages((prev) => prev.filter((c) => c.id !== id))
      toast({
        title: "成功",
        description: "コラージュを削除しました",
      })
    } catch (error) {
      console.error("Error deleting collage:", error)
      toast({
        title: "エラー",
        description: "コラージュの削除に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (collages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border-2 border-dashed border-purple-200 p-12">
          <div className="text-purple-300 mb-6">
            <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">コラージュがまだありません</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">カードのコラージュ画像を生成して、Xで共有しましょう！</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collages.map((collage) => (
        <Card key={collage.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 truncate">{collage.title1}</h3>
              <p className="text-sm text-gray-600">
                {collage.cardCount1}枚 + {collage.cardCount2}枚
              </p>
            </div>

            <div className="text-xs text-gray-500 mb-4">{new Date(collage.created_at).toLocaleDateString("ja-JP")}</div>

            <div className="flex gap-2">
              <Link href={`/collages/${collage.id}`} className="flex-1">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  詳細
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(collage.id)}
                disabled={isDeleting === collage.id}
              >
                {isDeleting === collage.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
