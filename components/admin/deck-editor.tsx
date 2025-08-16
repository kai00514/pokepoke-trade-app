"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Save, Eye } from "lucide-react"
import { toast } from "sonner"
import { CardSelectionModal } from "./card-selection-modal"
import { createDeck, updateDeck, type CreateDeckData } from "@/lib/actions/admin-decks"

interface DeckEditorProps {
  initialData?: any
  isEditing?: boolean
}

interface SelectedCard {
  card_id: number
  quantity: number
  card?: {
    id: number
    name: string
    image_url?: string
    game8_image_url?: string
    rarity?: string
    type?: string
  }
}

export function DeckEditor({ initialData, isEditing = false }: DeckEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateDeckData>({
    title: "",
    deck_name: "",
    category: "tier",
    thumbnail_image_url: "",
    thumbnail_alt: "",
    deck_badge: "",
    section1_title: "",
    energy_type: "",
    energy_image_url: "",
    deck_cards: [],
    deck_description: "",
    evaluation_title: "",
    tier_rank: "A",
    tier_name: "",
    tier_descriptions: [""],
    stat_accessibility: 3,
    stat_speed: 3,
    stat_power: 3,
    stat_durability: 3,
    stat_stability: 3,
    section2_title: "",
    strengths_weaknesses_list: [""],
    strengths_weaknesses_details: [],
    section3_title: "",
    how_to_play_list: [""],
    how_to_play_steps: [],
    is_published: false,
    view_count: 0,
    like_count: 0,
    favorite_count: 0,
    eval_value: "0.00",
    eval_count: 0,
    comment_count: 0,
  })

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        deck_cards: initialData.deck_cards || [],
        tier_descriptions: initialData.tier_descriptions || [""],
        strengths_weaknesses_list: initialData.strengths_weaknesses_list || [""],
        strengths_weaknesses_details: initialData.strengths_weaknesses_details || [],
        how_to_play_list: initialData.how_to_play_list || [""],
        how_to_play_steps: initialData.how_to_play_steps || [],
      })
    }
  }, [initialData])

  // Auto-generate titles when deck name changes
  useEffect(() => {
    if (formData.deck_name && !isEditing) {
      setFormData((prev) => ({
        ...prev,
        section1_title: `${formData.deck_name}のレシピと評価`,
        evaluation_title: `${formData.deck_name}の評価`,
        section2_title: `${formData.deck_name}の強い点・弱い点`,
        section3_title: `${formData.deck_name}の回し方`,
        thumbnail_alt: formData.deck_name,
        deck_badge: formData.deck_name,
      }))
    }
  }, [formData.deck_name, isEditing])

  const handleInputChange = (field: keyof CreateDeckData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: keyof CreateDeckData, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => (i === index ? value : item)),
    }))
  }

  const addArrayItem = (field: keyof CreateDeckData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), ""],
    }))
  }

  const removeArrayItem = (field: keyof CreateDeckData, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }))
  }

  const handleCardSelection = (selectedCards: SelectedCard[]) => {
    const deckCards = selectedCards.map((sc, index) => ({
      card_id: sc.card_id,
      card_count: sc.quantity,
      pack_name: sc.card?.type || "",
      display_order: index,
    }))
    handleInputChange("deck_cards", deckCards)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.deck_name) {
      toast.error("タイトルとデッキ名は必須です")
      return
    }

    setLoading(true)
    try {
      const result = isEditing ? await updateDeck(initialData.id, formData) : await createDeck(formData)

      if (result.success) {
        toast.success(isEditing ? "デッキを更新しました" : "デッキを作成しました")
        router.push("/admin/decks")
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch (error) {
      console.error("Error saving deck:", error)
      toast.error("保存中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const totalCards = formData.deck_cards.reduce((sum, card) => sum + card.card_count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isEditing ? "デッキ編集" : "デッキ作成"}</h1>
        <div className="flex items-center space-x-2">
          {isEditing && (
            <Button variant="outline" asChild>
              <a href={`/content/${initialData?.id}`} target="_blank" rel="noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                プレビュー
              </a>
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "保存中..." : "保存"}
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
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">ページタイトル *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="例: 最強のピカチュウデッキ構築ガイド"
                  />
                </div>
                <div>
                  <Label htmlFor="deck_name">デッキ名 *</Label>
                  <Input
                    id="deck_name"
                    value={formData.deck_name}
                    onChange={(e) => handleInputChange("deck_name", e.target.value)}
                    placeholder="例: ピカチュウex"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
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
                <div>
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
                <div>
                  <Label htmlFor="tier_name">Tier名</Label>
                  <Input
                    id="tier_name"
                    value={formData.tier_name}
                    onChange={(e) => handleInputChange("tier_name", e.target.value)}
                    placeholder="例: 環境トップ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="energy_type">エネルギータイプ</Label>
                  <Input
                    id="energy_type"
                    value={formData.energy_type}
                    onChange={(e) => handleInputChange("energy_type", e.target.value)}
                    placeholder="例: 電気"
                  />
                </div>
                <div>
                  <Label htmlFor="energy_image_url">エネルギー画像URL</Label>
                  <Input
                    id="energy_image_url"
                    value={formData.energy_image_url}
                    onChange={(e) => handleInputChange("energy_image_url", e.target.value)}
                    placeholder="例: /images/types/電気.png"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnail_image_url">サムネイル画像URL</Label>
                <Input
                  id="thumbnail_image_url"
                  value={formData.thumbnail_image_url}
                  onChange={(e) => handleInputChange("thumbnail_image_url", e.target.value)}
                  placeholder="画像URLを入力"
                />
              </div>

              <div>
                <Label htmlFor="deck_description">デッキ説明</Label>
                <Textarea
                  id="deck_description"
                  value={formData.deck_description}
                  onChange={(e) => handleInputChange("deck_description", e.target.value)}
                  placeholder="デッキの特徴や戦略を説明してください"
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
        <TabsContent value="deck">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>デッキ構成</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={totalCards > 60 ? "destructive" : "secondary"}>{totalCards}/60枚</Badge>
                  <Button onClick={() => setShowCardModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    カード追加
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {formData.deck_cards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">カードを追加してください</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.deck_cards.map((deckCard, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="text-sm font-medium mb-2">カードID: {deckCard.card_id}</div>
                      <div className="text-sm text-gray-600 mb-2">枚数: {deckCard.card_count}</div>
                      <div className="text-sm text-gray-600">パック: {deckCard.pack_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 評価タブ */}
        <TabsContent value="evaluation">
          <Card>
            <CardHeader>
              <CardTitle>デッキ評価</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>扱いやすさ: {formData.stat_accessibility}</Label>
                  <Slider
                    value={[formData.stat_accessibility]}
                    onValueChange={(value) => handleInputChange("stat_accessibility", value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>スピード: {formData.stat_speed}</Label>
                  <Slider
                    value={[formData.stat_speed]}
                    onValueChange={(value) => handleInputChange("stat_speed", value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>パワー: {formData.stat_power}</Label>
                  <Slider
                    value={[formData.stat_power]}
                    onValueChange={(value) => handleInputChange("stat_power", value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>耐久力: {formData.stat_durability}</Label>
                  <Slider
                    value={[formData.stat_durability]}
                    onValueChange={(value) => handleInputChange("stat_durability", value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>安定性: {formData.stat_stability}</Label>
                  <Slider
                    value={[formData.stat_stability]}
                    onValueChange={(value) => handleInputChange("stat_stability", value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label>Tier説明</Label>
                <div className="space-y-2 mt-2">
                  {formData.tier_descriptions.map((desc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={desc}
                        onChange={(e) => handleArrayChange("tier_descriptions", index, e.target.value)}
                        placeholder="Tierの説明を入力"
                      />
                      {formData.tier_descriptions.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem("tier_descriptions", index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayItem("tier_descriptions")}>
                    <Plus className="h-4 w-4 mr-2" />
                    説明を追加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 強み・弱みタブ */}
        <TabsContent value="strengths">
          <Card>
            <CardHeader>
              <CardTitle>強み・弱み</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>強み・弱み一覧</Label>
                <div className="space-y-2 mt-2">
                  {formData.strengths_weaknesses_list.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange("strengths_weaknesses_list", index, e.target.value)}
                        placeholder="強みまたは弱みを入力"
                      />
                      {formData.strengths_weaknesses_list.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem("strengths_weaknesses_list", index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayItem("strengths_weaknesses_list")}>
                    <Plus className="h-4 w-4 mr-2" />
                    項目を追加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 立ち回りタブ */}
        <TabsContent value="howto">
          <Card>
            <CardHeader>
              <CardTitle>立ち回り</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>立ち回り一覧</Label>
                <div className="space-y-2 mt-2">
                  {formData.how_to_play_list.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange("how_to_play_list", index, e.target.value)}
                        placeholder="立ち回りのポイントを入力"
                      />
                      {formData.how_to_play_list.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem("how_to_play_list", index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addArrayItem("how_to_play_list")}>
                    <Plus className="h-4 w-4 mr-2" />
                    項目を追加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 詳細設定タブ */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>詳細設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="view_count">閲覧数</Label>
                  <Input
                    id="view_count"
                    type="number"
                    value={formData.view_count}
                    onChange={(e) => handleInputChange("view_count", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="like_count">いいね数</Label>
                  <Input
                    id="like_count"
                    type="number"
                    value={formData.like_count}
                    onChange={(e) => handleInputChange("like_count", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
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
                <div>
                  <Label htmlFor="eval_value">評価値</Label>
                  <Input
                    id="eval_value"
                    value={formData.eval_value}
                    onChange={(e) => handleInputChange("eval_value", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="eval_count">評価数</Label>
                  <Input
                    id="eval_count"
                    type="number"
                    value={formData.eval_count}
                    onChange={(e) => handleInputChange("eval_count", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="comment_count">コメント数</Label>
                  <Input
                    id="comment_count"
                    type="number"
                    value={formData.comment_count}
                    onChange={(e) => handleInputChange("comment_count", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="section1_title">セクション1タイトル</Label>
                  <Input
                    id="section1_title"
                    value={formData.section1_title}
                    onChange={(e) => handleInputChange("section1_title", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="evaluation_title">評価セクションタイトル</Label>
                  <Input
                    id="evaluation_title"
                    value={formData.evaluation_title}
                    onChange={(e) => handleInputChange("evaluation_title", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="section2_title">セクション2タイトル</Label>
                  <Input
                    id="section2_title"
                    value={formData.section2_title}
                    onChange={(e) => handleInputChange("section2_title", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="section3_title">セクション3タイトル</Label>
                  <Input
                    id="section3_title"
                    value={formData.section3_title}
                    onChange={(e) => handleInputChange("section3_title", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Card Selection Modal */}
      <CardSelectionModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        onConfirm={handleCardSelection}
        initialSelectedCards={formData.deck_cards.map((dc) => ({
          card_id: dc.card_id,
          quantity: dc.card_count,
        }))}
      />
    </div>
  )
}
