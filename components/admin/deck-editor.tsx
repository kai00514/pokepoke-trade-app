"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Save, ArrowLeft, Plus, X, Eye } from "lucide-react"
import { toast } from "sonner"
import { CardDisplay } from "./card-display" // Import CardDisplay component

import { type CreateDeckData, createDeck, updateDeck } from "@/lib/actions/admin-decks"
import { ImageUpload } from "./image-upload"
import { CardSelectionModal } from "./card-selection-modal"

interface DeckEditorProps {
  deck?: any
  isEditing?: boolean
}

const categories = [
  { value: "tier", label: "Tier" },
  { value: "featured", label: "注目" },
  { value: "newpack", label: "新パック" },
]

const tierRanks = [
  { value: "SS", label: "SS" },
  { value: "S", label: "S" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
]

const energyTypes = [
  { value: "炎", label: "炎", image: "/images/types/炎.png" },
  { value: "水", label: "水", image: "/images/types/水.png" },
  { value: "草", label: "草", image: "/images/types/草.png" },
  { value: "電気", label: "電気", image: "/images/types/電気.png" },
  { value: "念", label: "念", image: "/images/types/念.png" },
  { value: "格闘", label: "格闘", image: "/images/types/格闘.png" },
  { value: "悪", label: "悪", image: "/images/types/悪.png" },
  { value: "鋼", label: "鋼", image: "/images/types/鋼.png" },
  { value: "龍", label: "龍", image: "/images/types/龍.png" },
  { value: "無色", label: "無色", image: "/images/types/無色.png" },
]

export function DeckEditor({ deck, isEditing = false }: DeckEditorProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")

  const [formData, setFormData] = useState<CreateDeckData>({
    // 基本情報
    title: deck?.title || "",
    deck_name: deck?.deck_name || "",
    category: deck?.category || "tier",
    thumbnail_image_url: deck?.thumbnail_image_url || "",
    thumbnail_alt: deck?.thumbnail_alt || "",
    deck_badge: deck?.deck_badge || "",

    // セクション1
    section1_title: deck?.section1_title || "",
    energy_type: deck?.energy_type || "炎",
    energy_image_url: deck?.energy_image_url || "",
    deck_cards: deck?.deck_cards || [],
    deck_description: deck?.deck_description || "",

    // 評価セクション
    evaluation_title: deck?.evaluation_title || "",
    tier_rank: deck?.tier_rank || "A",
    tier_name: deck?.tier_name || "Tier3",
    tier_descriptions: deck?.tier_descriptions || [],
    stat_accessibility: deck?.stat_accessibility || 3,
    stat_speed: deck?.stat_speed || 3,
    stat_power: deck?.stat_power || 3,
    stat_durability: deck?.stat_durability || 3,
    stat_stability: deck?.stat_stability || 3,

    // セクション2
    section2_title: deck?.section2_title || "",
    strengths_weaknesses_list: deck?.strengths_weaknesses_list || [],
    strengths_weaknesses_details: deck?.strengths_weaknesses_details || [],

    // セクション3
    section3_title: deck?.section3_title || "",
    how_to_play_list: deck?.how_to_play_list || [],
    how_to_play_steps: deck?.how_to_play_steps || [],

    // その他
    is_published: deck?.is_published || false,
    view_count: deck?.view_count || 0,
    like_count: deck?.like_count || 0,
    favorite_count: deck?.favorite_count || 0,
    eval_value: deck?.eval_value || "0.00",
    eval_count: deck?.eval_count || 0,
    comment_count: deck?.comment_count || 0,
  })

  // エネルギータイプが変更されたときに画像URLを更新
  useEffect(() => {
    const energyType = energyTypes.find((e) => e.value === formData.energy_type)
    if (energyType) {
      setFormData((prev) => ({ ...prev, energy_image_url: energyType.image }))
    }
  }, [formData.energy_type])

  // デッキ名が変更されたときにタイトルを自動生成
  useEffect(() => {
    if (formData.deck_name && !isEditing) {
      setFormData((prev) => ({
        ...prev,
        title: `【ポケポケ】${formData.deck_name}のレシピと評価【ポケモンカードアプリ】`,
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

  const handleSave = async () => {
    // バリデーション
    if (!formData.title.trim()) {
      toast.error("タイトルを入力してください")
      return
    }

    if (!formData.deck_name.trim()) {
      toast.error("デッキ名を入力してください")
      return
    }

    setIsSaving(true)

    try {
      let result
      if (isEditing && deck?.id) {
        result = await updateDeck(deck.id, formData)
      } else {
        result = await createDeck(formData)
      }

      if (result.success) {
        toast.success(isEditing ? "デッキを更新しました" : "デッキを作成しました")
        router.push("/admin/decks")
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("保存中にエラーが発生しました")
    } finally {
      setIsSaving(false)
    }
  }

  const addTierDescription = () => {
    setFormData((prev) => ({
      ...prev,
      tier_descriptions: [...prev.tier_descriptions, ""],
    }))
  }

  const updateTierDescription = (index: number, value: string) => {
    const updated = [...formData.tier_descriptions]
    updated[index] = value
    setFormData((prev) => ({ ...prev, tier_descriptions: updated }))
  }

  const removeTierDescription = (index: number) => {
    const updated = formData.tier_descriptions.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, tier_descriptions: updated }))
  }

  const addStrengthWeakness = () => {
    const newItem = {
      title: "",
      image_urls: [],
      description: "",
      display_order: formData.strengths_weaknesses_details.length + 1,
    }
    setFormData((prev) => ({
      ...prev,
      strengths_weaknesses_details: [...prev.strengths_weaknesses_details, newItem],
      strengths_weaknesses_list: [...prev.strengths_weaknesses_list, ""],
    }))
  }

  const updateStrengthWeakness = (index: number, field: string, value: any) => {
    const updated = [...formData.strengths_weaknesses_details]
    updated[index] = { ...updated[index], [field]: value }
    setFormData((prev) => ({ ...prev, strengths_weaknesses_details: updated }))

    // リストも更新
    if (field === "title") {
      const updatedList = [...formData.strengths_weaknesses_list]
      updatedList[index] = value
      setFormData((prev) => ({ ...prev, strengths_weaknesses_list: updatedList }))
    }
  }

  const removeStrengthWeakness = (index: number) => {
    const updatedDetails = formData.strengths_weaknesses_details.filter((_, i) => i !== index)
    const updatedList = formData.strengths_weaknesses_list.filter((_, i) => i !== index)
    setFormData((prev) => ({
      ...prev,
      strengths_weaknesses_details: updatedDetails,
      strengths_weaknesses_list: updatedList,
    }))
  }

  const addHowToPlayStep = () => {
    const newStep = {
      title: "",
      image_urls: [],
      description: "",
      step_number: formData.how_to_play_steps.length + 1,
    }
    setFormData((prev) => ({
      ...prev,
      how_to_play_steps: [...prev.how_to_play_steps, newStep],
      how_to_play_list: [...prev.how_to_play_list, ""],
    }))
  }

  const updateHowToPlayStep = (index: number, field: string, value: any) => {
    const updated = [...formData.how_to_play_steps]
    updated[index] = { ...updated[index], [field]: value }
    setFormData((prev) => ({ ...prev, how_to_play_steps: updated }))

    // リストも更新
    if (field === "title") {
      const updatedList = [...formData.how_to_play_list]
      updatedList[index] = value
      setFormData((prev) => ({ ...prev, how_to_play_list: updatedList }))
    }
  }

  const removeHowToPlayStep = (index: number) => {
    const updatedSteps = formData.how_to_play_steps.filter((_, i) => i !== index)
    const updatedList = formData.how_to_play_list.filter((_, i) => i !== index)
    setFormData((prev) => ({
      ...prev,
      how_to_play_steps: updatedSteps,
      how_to_play_list: updatedList,
    }))
  }

  const previewUrl = isEditing && deck?.id ? `/content/${deck.id}` : null

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">{isEditing ? "デッキ編集" : "デッキ作成"}</h1>
        </div>
        <div className="flex items-center space-x-2">
          {previewUrl && (
            <Button variant="outline" onClick={() => window.open(previewUrl, "_blank")}>
              <Eye className="h-4 w-4 mr-2" />
              プレビュー
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="cards">デッキ構成</TabsTrigger>
          <TabsTrigger value="evaluation">評価</TabsTrigger>
          <TabsTrigger value="strengths">強み・弱み</TabsTrigger>
          <TabsTrigger value="howto">立ち回り</TabsTrigger>
          <TabsTrigger value="advanced">詳細設定</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">記事タイトル *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="【ポケポケ】〇〇デッキのレシピと評価【ポケモンカードアプリ】"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deck_name">デッキ名 *</Label>
                    <Input
                      id="deck_name"
                      value={formData.deck_name}
                      onChange={(e) => handleInputChange("deck_name", e.target.value)}
                      placeholder="〇〇デッキ"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deck_badge">デッキバッジ</Label>
                    <Input
                      id="deck_badge"
                      value={formData.deck_badge}
                      onChange={(e) => handleInputChange("deck_badge", e.target.value)}
                      placeholder="デッキバッジテキスト"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail_alt">サムネイルAltテキスト</Label>
                    <Input
                      id="thumbnail_alt"
                      value={formData.thumbnail_alt}
                      onChange={(e) => handleInputChange("thumbnail_alt", e.target.value)}
                      placeholder="サムネイル画像の説明"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">カテゴリー</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="カテゴリーを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="energy_type">エネルギータイプ</Label>
                      <Select
                        value={formData.energy_type}
                        onValueChange={(value) => handleInputChange("energy_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="エネルギータイプを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {energyTypes.map((energy) => (
                            <SelectItem key={energy.value} value={energy.value}>
                              <div className="flex items-center space-x-2">
                                <img src={energy.image || "/placeholder.svg"} alt={energy.label} className="w-4 h-4" />
                                <span>{energy.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>セクションタイトル</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="section1_title">セクション1タイトル</Label>
                    <Input
                      id="section1_title"
                      value={formData.section1_title}
                      onChange={(e) => handleInputChange("section1_title", e.target.value)}
                      placeholder="〇〇デッキのレシピと評価"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evaluation_title">評価セクションタイトル</Label>
                    <Input
                      id="evaluation_title"
                      value={formData.evaluation_title}
                      onChange={(e) => handleInputChange("evaluation_title", e.target.value)}
                      placeholder="〇〇デッキの評価"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section2_title">セクション2タイトル</Label>
                    <Input
                      id="section2_title"
                      value={formData.section2_title}
                      onChange={(e) => handleInputChange("section2_title", e.target.value)}
                      placeholder="〇〇デッキの強い点・弱い点"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section3_title">セクション3タイトル</Label>
                    <Input
                      id="section3_title"
                      value={formData.section3_title}
                      onChange={(e) => handleInputChange("section3_title", e.target.value)}
                      placeholder="〇〇デッキの回し方"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>公開設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="published">公開する</Label>
                    <Switch
                      id="published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => handleInputChange("is_published", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>サムネイル画像</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    value={formData.thumbnail_image_url}
                    onChange={(url) => handleInputChange("thumbnail_image_url", url)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cards" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>デッキ構成</CardTitle>
                <CardSelectionModal
                  selectedCards={formData.deck_cards}
                  onChange={(cards) => handleInputChange("deck_cards", cards)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deck_description">デッキ説明</Label>
                <Textarea
                  id="deck_description"
                  value={formData.deck_description}
                  onChange={(e) => handleInputChange("deck_description", e.target.value)}
                  placeholder="デッキの概要を入力"
                  rows={4}
                />
              </div>

              {/* 選択されたカード一覧 */}
              <div className="space-y-2">
                <Label>選択されたカード ({formData.deck_cards.length}枚)</Label>
                {formData.deck_cards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    「カードを選択」ボタンからカードを追加してください
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {formData.deck_cards.map((card, index) => (
                      <Card key={`${card.card_id}-${index}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-16 flex-shrink-0">
                              <CardDisplay cardId={card.card_id} useThumb />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">ID: {card.card_id}</div>
                              <div className="text-xs text-gray-500">{card.pack_name}</div>
                              <div className="text-xs font-medium">×{card.card_count}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tier評価</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tier_rank">Tierランク</Label>
                  <Select value={formData.tier_rank} onValueChange={(value) => handleInputChange("tier_rank", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tierランクを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {tierRanks.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tier_name">Tier名</Label>
                  <Input
                    id="tier_name"
                    value={formData.tier_name}
                    onChange={(e) => handleInputChange("tier_name", e.target.value)}
                    placeholder="Tier1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tier説明</Label>
                    <Button variant="outline" size="sm" onClick={addTierDescription}>
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>
                  {formData.tier_descriptions.map((desc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={desc}
                        onChange={(e) => updateTierDescription(index, e.target.value)}
                        placeholder="説明を入力"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTierDescription(index)}
                        className="text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ステータス評価</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>使いやすさ: {formData.stat_accessibility}</Label>
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
                    <Label>スピード: {formData.stat_speed}</Label>
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
                    <Label>パワー: {formData.stat_power}</Label>
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
                    <Label>耐久力: {formData.stat_durability}</Label>
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
                    <Label>安定性: {formData.stat_stability}</Label>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strengths" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>強み・弱み</CardTitle>
                <Button variant="outline" onClick={addStrengthWeakness}>
                  <Plus className="h-4 w-4 mr-2" />
                  項目追加
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.strengths_weaknesses_details.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>項目 {index + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStrengthWeakness(index)}
                        className="text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>タイトル</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateStrengthWeakness(index, "title", e.target.value)}
                        placeholder="強み・弱みのタイトル"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>説明</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateStrengthWeakness(index, "description", e.target.value)}
                        placeholder="詳細な説明を入力"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formData.strengths_weaknesses_details.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  「項目追加」ボタンから強み・弱みを追加してください
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="howto" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>立ち回り手順</CardTitle>
                <Button variant="outline" onClick={addHowToPlayStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  手順追加
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.how_to_play_steps.map((step, index) => (
                <Card key={index}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>手順 {index + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHowToPlayStep(index)}
                        className="text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>タイトル</Label>
                      <Input
                        value={step.title}
                        onChange={(e) => updateHowToPlayStep(index, "title", e.target.value)}
                        placeholder="手順のタイトル"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>説明</Label>
                      <Textarea
                        value={step.description}
                        onChange={(e) => updateHowToPlayStep(index, "description", e.target.value)}
                        placeholder="手順の詳細な説明を入力"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formData.how_to_play_steps.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  「手順追加」ボタンから立ち回り手順を追加してください
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>統計情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="view_count">閲覧数</Label>
                  <Input
                    id="view_count"
                    type="number"
                    value={formData.view_count}
                    onChange={(e) => handleInputChange("view_count", Number.parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="like_count">いいね数</Label>
                  <Input
                    id="like_count"
                    type="number"
                    value={formData.like_count}
                    onChange={(e) => handleInputChange("like_count", Number.parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favorite_count">お気に入り数</Label>
                  <Input
                    id="favorite_count"
                    type="number"
                    value={formData.favorite_count}
                    onChange={(e) => handleInputChange("favorite_count", Number.parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment_count">コメント数</Label>
                  <Input
                    id="comment_count"
                    type="number"
                    value={formData.comment_count}
                    onChange={(e) => handleInputChange("comment_count", Number.parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>評価情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
