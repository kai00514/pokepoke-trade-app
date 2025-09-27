"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Globe, Monitor, Calendar, ExternalLink } from "lucide-react"
import { getTournaments, deleteTournament, type Tournament } from "@/lib/actions/admin-tournaments"
import { TournamentForm } from "@/components/admin/tournament-form"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(true)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const loadTournaments = async () => {
    try {
      const data = await getTournaments(showAll)
      setTournaments(data)
    } catch (error) {
      console.error("Error loading tournaments:", error)
      toast({
        title: "エラー",
        description: "トーナメントの読み込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTournaments()
  }, [showAll])

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTournament(id)
      toast({
        title: "成功",
        description: "トーナメントを削除しました",
      })
      loadTournaments()
    } catch (error) {
      toast({
        title: "エラー",
        description: "トーナメントの削除に失敗しました",
        variant: "destructive",
      })
    }
    setDeleteId(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingTournament(null)
    loadTournaments()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">トーナメント管理</h1>
        <div className="flex gap-2">
          <Button variant={showAll ? "default" : "outline"} onClick={() => setShowAll(!showAll)}>
            {showAll ? "公開のみ表示" : "全件表示"}
          </Button>
          <Button
            onClick={() => {
              setEditingTournament(null)
              setShowForm(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {tournaments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">トーナメントがありません</p>
            </CardContent>
          </Card>
        ) : (
          tournaments.map((tournament) => (
            <Card key={tournament.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      {tournament.title}
                      <div className="flex gap-1">
                        {tournament.is_online ? (
                          <Badge variant="secondary">
                            <Monitor className="h-3 w-3 mr-1" />
                            オンライン
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Globe className="h-3 w-3 mr-1" />
                            オフライン
                          </Badge>
                        )}
                        <Badge variant={tournament.is_published ? "default" : "destructive"}>
                          {tournament.is_published ? "公開" : "非公開"}
                        </Badge>
                      </div>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(tournament.event_date)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tournament)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(tournament.id!)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tournament.benefit && (
                    <div>
                      <span className="font-medium">特典: </span>
                      <span>{tournament.benefit}</span>
                    </div>
                  )}
                  {tournament.detail_url && (
                    <div>
                      <span className="font-medium">詳細URL: </span>
                      <a
                        href={tournament.detail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {tournament.detail_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showForm && (
        <TournamentForm
          tournament={editingTournament}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false)
            setEditingTournament(null)
          }}
        />
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>トーナメントを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消すことができません。トーナメントが完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
