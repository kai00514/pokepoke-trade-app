"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createTournament, updateTournament, type Tournament } from "@/lib/actions/admin-tournaments"
import { toast } from "@/hooks/use-toast"

interface TournamentFormProps {
  tournament?: Tournament | null
  onSuccess: () => void
  onCancel: () => void
}

export function TournamentForm({ tournament, onSuccess, onCancel }: TournamentFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: tournament?.title || "",
    event_date: tournament?.event_date ? new Date(tournament.event_date).toISOString().slice(0, 16) : "",
    is_online: tournament?.is_online ?? true,
    benefit: tournament?.benefit || "",
    detail_url: tournament?.detail_url || "",
    is_published: tournament?.is_published ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tournamentData = {
        ...formData,
        event_date: new Date(formData.event_date).toISOString(),
      }

      if (tournament?.id) {
        await updateTournament(tournament.id, tournamentData)
        toast({
          title: "成功",
          description: "トーナメントを更新しました",
        })
      } else {
        await createTournament(tournamentData)
        toast({
          title: "成功",
          description: "トーナメントを作成しました",
        })
      }

      onSuccess()
    } catch (error) {
      toast({
        title: "エラー",
        description: tournament?.id ? "トーナメントの更新に失敗しました" : "トーナメントの作成に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{tournament?.id ? "トーナメント編集" : "新規トーナメント作成"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">大会名 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date">開催日時 *</Label>
              <Input
                id="event_date"
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_online"
                checked={formData.is_online}
                onCheckedChange={(checked) => setFormData({ ...formData, is_online: checked })}
              />
              <Label htmlFor="is_online">オンライン開催</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit">特典</Label>
              <Textarea
                id="benefit"
                value={formData.benefit}
                onChange={(e) => setFormData({ ...formData, benefit: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail_url">詳細URL</Label>
              <Input
                id="detail_url"
                type="url"
                value={formData.detail_url}
                onChange={(e) => setFormData({ ...formData, detail_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
              <Label htmlFor="is_published">公開する</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "保存中..." : tournament?.id ? "更新" : "作成"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
