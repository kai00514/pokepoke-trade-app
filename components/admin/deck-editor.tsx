"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { CardSelectionModal } from "./card-selection-modal"
import { CardDisplay } from "./card-display"
import { createDeck, updateDeck, type CreateDeckData } from "@/lib/actions/admin-decks"

interface DeckEditorProps {
  initialData?: any
  isEditing?: boolean
  deckId?: string
}

interface SelectedCard {
  id: number
  name: string
  image_url?: string
  rarity?: string
  type?: string
  quantity: number
}

export function DeckEditor({ initialData, isEditing = false, deckId }: DeckEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)

  // フォームデータ
  const [formData, setFormData] = useState<CreateDeckData>({
    // 基本情報
    title: "",
    deck_name: "",
    category: "tier",
    thumbnail_image_url: "",
    thumbnail_alt: "",
    deck_badge: "",

    // セクション1
    section1_title: "",
    energy_type: "",
    energy_image_url: "",
    deck_cards: [],
    deck_description: "",

    // 評価セクション
    evaluation_title: "",
    tier_rank: "A",
    tier_name: "",
    tier_descriptions: [],
    stat_accessibility: 3,
    stat_speed: 3,
    stat_power: 3,
    stat_durability: 3,
    stat_stability: 3,

    // セクション2
    section2_title: "",
    strengths_weaknesses_list: [],
    strengths_weaknesses_details: [],

    // セクション3
    section3_title: "",
    how_to_play_list: [],
    how_to_play_steps: [],

    // その他
    is_published: false,
    view_count: 0,
    like_count: 0,
    favorite_count: 0,
    eval_value: "0.00",
    eval_count: 0,
    comment_count: 0,
  })

  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])

  // 初期データの設定
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        deck_cards: initialData.deck_cards || [],
        strengths_weaknesses_details: initialData.strengths_weaknesses_details || [],
        how_to_play_steps: initialData.how_to_play_steps || [],
      })

      // カードデータの変換
      if (initialData.deck_cards) {
        const cards = initialData.deck_cards.map((card: any) => ({
          id: card.card_id,
          name: card.name || `カード${card.card_id}`,
          quantity: card.card_count,
          image_url: card.image_url,
          rarity: card.rarity,
          type: card.type,
        }))
        setSelectedCards(cards)
      }
    }
  }, [initialData])

  // デッキ名が変更されたときに関連タイトルを自動生成
  useEffect(() => {
    if (formData.deck_name) {
      setFormData((prev) => ({
        ...prev,
        section1_title: prev.section1_title || `${formData.deck_name}のレシピと評価`,
        evaluation_title: prev.evaluation_title || `${formData.deck_name}の評価`,
        section2_title: prev.section2_title || `${formData.deck_name}の強い点・弱い点`,
        section3_title: prev.section3_title || `${formData.deck_name}の回し方`,
        thumbnail_alt: prev.thumbnail_alt || formData.deck_name,
        deck_badge: prev.deck_badge || formData.deck_name,
      }))
    }
  }, [formData.deck_name])

  const handleInputChange = (field: keyof CreateDeckData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleArrayChange = (field: keyof CreateDeckData, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => (i === index ? value : item)),
    }))
  }

  const handleAddArrayItem = (field: keyof CreateDeckData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ""],
    }))
  }

  const handleRemoveArrayItem = (field: keyof CreateDeckData, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }))
  }

  const handleCardSelection = (cards: SelectedCard[]) => {
    setSelectedCards(cards)

    // フォームデータに変換
    const deckCards = cards.map((card, index) => ({
      card_id: card.id,
      card_count: card.quantity,
      pack_name: card.type || "",
      display_order: index + 1,
    }))

    setFormData((prev) => ({
      ...prev,
      deck_cards: deckCards,
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.deck_name) {
      toast.error("タイトルとデッキ名は必須です")
      return
    }

    setLoading(true)
    try {
      const result = isEditing && deckId ? await updateDeck(deckId, formData) : await createDeck(formData)

      if (result.success) {
        toast.success(isEditing ? "デッキを更新しました" : "デッキを作成しました")
        router.push("/admin/decks")
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch (error) {
      console.error("保存エラー:", error)
      toast.error("保存中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const totalCards = selectedCards.reduce((sum, card) => sum + card.quantity, 0)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isEditing ? "デッキ編集" : "デッキ作成"}</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "保存中..." : isEditing ? "更新" : "作成"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="deck">デッキ構成</TabsTrigger>
          <TabsTrigger value="evaluation">評価</TabsTrigger>
          <TabsTrigger value="strengths">強み・弱み</TabsTrigger>
          <TabsTrigger value="howto">立ち回り</TabsTrigger>
          <TabsTrigger value="settings">詳細設定</TabsTrigger>
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="デッキのタイトルを入力"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deck_name">デッキ名 *</Label>
                  <Input
                    id="deck_name"
                    value={formData.deck_name}
                    onChange={(e) => handleInputChange("deck_name", e.target.value)}
                    placeholder="デッキ名を入力"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリー</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier">Tier</SelectItem>
                      <SelectItem value="featured">注目</SelectItem>
                      <SelectItem value="newpack">新パック</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="energy_type">エネルギータイプ</Label>
                  <Input
                    id="energy_type"
                    value={formData.energy_type}
                    onChange={(e) => handleInputChange("energy_type", e.target.value)}
                    placeholder="例: 炎、水、草"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier_rank">Tierランク</Label>
                  <Select value={formData.tier_rank} onValueChange={(value) => handleInputChange("tier_rank", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SS">SS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail_image_url">サムネイル画像URL</Label>
                <Input
                  id="thumbnail_image_url"
                  value={formData.thumbnail_image_url}
                  onChange={(e) => handleInputChange("thumbnail_image_url", e.target.value)}
                  placeholder="画像URLを入力"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deck_description">デッキ説明</Label>
                <Textarea
                  id="deck_description"
                  value={formData.deck_description}
                  onChange={(e) => handleInputChange("deck_description", e.target.value)}
                  placeholder="デッキの説明を入力"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => handleInputChange("is_published", checked)}
                />
                <Label htmlFor="is_published">公開する</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* デッキ構成タブ */}
        <TabsContent value="deck" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>デッキ構成</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={totalCards > 60 ? "destructive" : "default"}>{totalCards}/60枚</Badge>
                  <Button onClick={() => setShowCardModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    カード追加
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedCards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  カードが選択されていません。「カード追加」ボタンからカードを選択してください。
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCards.map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      quantity={card.quantity}
                      showControls={true}
                      onQuantityChange={(cardId, quantity) => {
                        const updatedCards = selectedCards
                          .map((c) => (c.id === cardId ? { ...c, quantity } : c))
                          .filter((c) => c.quantity > 0)
                        setSelectedCards(updatedCards)
                        handleCardSelection(updatedCards)
                      }}
                      onRemove={(cardId) => {
                        const updatedCards = selectedCards.filter((c) => c.id !== cardId)
                        setSelectedCards(updatedCards)
                        handleCardSelection(updatedCards)
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 評価タブ */}
        <TabsContent value="evaluation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>デッキ評価</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier_name">Tier名</Label>
                  <Input
                    id="tier_name"
                    value={formData.tier_name}
                    onChange={(e) => handleInputChange("tier_name", e.target.value)}
                    placeholder="例: 環境トップクラス"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">ステータス評価</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>扱いやすさ</Label>
                      <Badge variant="outline">{formData.stat_accessibility}/5</Badge>
                    </div>
                    <Slider
                      value={[formData.stat_accessibility]}
                      onValueChange={(value) => handleInputChange("stat_accessibility", value[0])}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>スピード</Label>
                      <Badge variant="outline">{formData.stat_speed}/5</Badge>
                    </div>
                    <Slider
                      value={[formData.stat_speed]}
                      onValueChange={(value) => handleInputChange("stat_speed", value[0])}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>パワー</Label>
                      <Badge variant="outline">{formData.stat_power}/5</Badge>
                    </div>
                    <Slider
                      value={[formData.stat_power]}
                      onValueChange={(value) => handleInputChange("stat_power", value[0])}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>耐久力</Label>
                      <Badge variant="outline">{formData.stat_durability}/5</Badge>
                    </div>
                    <Slider
                      value={[formData.stat_durability]}
                      onValueChange={(value) => handleInputChange("stat_durability", value[0])}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>安定性</Label>
                      <Badge variant="outline">{formData.stat_stability}/5</Badge>
                    </div>
                    <Slider
                      value={[formData.stat_stability]}
                      onValueChange={(value) => handleInputChange("stat_stability", value[0])}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 強み・弱みタブ */}
        <TabsContent value="strengths" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>強み・弱み</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>強み・弱み一覧</Label>
                  <Button variant="outline" size="sm" onClick={() => handleAddArrayItem("strengths_weaknesses_list")}>
                    <Plus className="h-3 w-3 mr-1" />
                    追加
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.strengths_weaknesses_list.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange("strengths_weaknesses_list", index, e.target.value)}
                        placeholder="強みまたは弱みを入力"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveArrayItem("strengths_weaknesses_list", index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 立ち回りタブ */}
        <TabsContent value="howto" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>立ち回り</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>立ち回りポイント</Label>
                  <Button variant="outline" size="sm" onClick={() => handleAddArrayItem("how_to_play_list")}>
                    <Plus className="h-3 w-3 mr-1" />
                    追加
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.how_to_play_list.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange("how_to_play_list", index, e.target.value)}
                        placeholder="立ち回りポイントを入力"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveArrayItem("how_to_play_list", index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 詳細設定タブ */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>詳細設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="view_count">閲覧数</Label>
                  <Input
                    id="view_count"
                    type="number"
                    value={formData.view_count}
                    onChange={(e) => handleInputChange("view_count", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="like_count">いいね数</Label>
                  <Input
                    id="like_count"
                    type="number"
                    value={formData.like_count}
                    onChange={(e) => handleInputChange("like_count", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favorite_count">お気に入り数</Label>
                  <Input
                    id="favorite_count"
                    type="number"
                    value={formData.favorite_count}
                    onChange={(e) => handleInputChange("favorite_count", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eval_value">評価値</Label>
                  <Input
                    id="eval_value"
                    value={formData.eval_value}
                    onChange={(e) => handleInputChange("eval_value", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eval_count">評価数</Label>
                  <Input
                    id="eval_count"
                    type="number"
                    value={formData.eval_count}
                    onChange={(e) => handleInputChange("eval_count", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment_count">コメント数</Label>
                  <Input
                    id="comment_count"
                    type="number"
                    value={formData.comment_count}
                    onChange={(e) => handleInputChange("comment_count", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* カード選択モーダル */}
      <CardSelectionModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        onConfirm={handleCardSelection}
        initialSelectedCards={selectedCards}
      />
    </div>
  )
}
