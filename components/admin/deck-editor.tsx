"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card as DeckCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, Eye, Plus, Trash2, GripVertical, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import DetailedSearchModal from "@/components/detailed-search-modal"
import DeckCardSelectionModal, { type DeckCard as DeckCardType } from "@/components/admin/deck-card-selection-modal"
import { DeckPreviewModal } from "@/components/admin/deck-preview-modal"
import { createDeckPage, updateDeckPage, type DeckPageData } from "@/lib/actions/admin-deck-pages"
import { ImageUpload } from "@/components/admin/image-upload"
import CardDisplay from "@/components/card-display"

interface DeckEditorProps {
  deck?: any
  isEditing?: boolean
}

export function DeckEditor({ deck, isEditing = false }: DeckEditorProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isCardSearchOpen, setIsCardSearchOpen] = useState(false)
  const [isDeckCardSelectionOpen, setIsDeckCardSelectionOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [formData, setFormData] = useState({
    title: deck?.title || "",
    deck_name: deck?.deck_name || "",
    deck_description: deck?.deck_description || "",
    deck_badge: deck?.deck_badge || "",
    thumbnail_image_url: deck?.thumbnail_image_url || "",
    thumbnail_alt: deck?.thumbnail_alt || "",
    section1_title: deck?.section1_title || "",
    section2_title: deck?.section2_title || "",
    section3_title: deck?.section3_title || "",
    category: deck?.category || "tier",
    energy_type: deck?.energy_type || "",
    evaluation_title: deck?.evaluation_title || "",
    tier_rank: deck?.tier_rank || "A",
    tier_name: deck?.tier_name || "",
    tier_descriptions: deck?.tier_descriptions || [""],
    is_published: deck?.is_published || false,
    stats: {
      accessibility: deck?.stat_accessibility || 3,
      speed: deck?.stat_speed || 3,
      power: deck?.stat_power || 3,
      durability: deck?.stat_durability || 3,
      stability: deck?.stat_stability || 3,
    },
    strengths_weaknesses_list: deck?.strengths_weaknesses_list || [""],
    how_to_play_list: deck?.how_to_play_list || [""],
  })

  const [deckCards, setDeckCards] = useState([
    {
      id: 1,
      card_id: 1533,
      card_name: "ピカチュウ",
      pack_name: "拡張パック「スカーレット&バイオレット」",
      card_count: 4,
      display_order: 0,
    },
    {
      id: 2,
      card_id: 1532,
      card_name: "ライチュウ",
      pack_name: "拡張パック「クレイバースト」",
      card_count: 2,
      display_order: 1,
    },
  ])

  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState([
    {
      id: 1,
      title: "安定した試合展開ができる",
      description: "グラジオによりタイプ：ヌルとシルヴァディを手札に揃えやすくなっています。",
      image_urls: [],
      display_order: 1,
    },
    {
      id: 2,
      title: "デッキの拡張性が高い",
      description: "シルヴァディは無色エネルギーでワザを使えるため、サブアタッカーに様々な選択肢を取ることができます。",
      image_urls: [],
      display_order: 2,
    },
  ])

  const [playSteps, setPlaySteps] = useState([
    {
      id: 1,
      step_number: 1,
      title: "序盤から積極的に攻撃",
      description: "序盤からシルヴァディで攻撃していきます。グラジオでシルヴァディをサーチして素早く進化させましょう。",
      image_urls: [],
    },
    {
      id: 2,
      step_number: 2,
      title: "サブアタッカーを育成",
      description: "シルヴァディで戦っている間にベンチでサブアタッカーを育成しましょう。",
      image_urls: [],
    },
  ])

  const [editingStrengthWeakness, setEditingStrengthWeakness] = useState<any>(null)
  const [isEditingStrengthWeakness, setIsEditingStrengthWeakness] = useState(false)
  const [editingPlayStep, setEditingPlayStep] = useState<any>(null)
  const [isEditingPlayStep, setIsEditingPlayStep] = useState(false)
  const [isImageSelectionOpen, setIsImageSelectionOpen] = useState(false)
  const [currentImageTarget, setCurrentImageTarget] = useState<{ type: "strength" | "play"; id: number } | null>(null)

  const totalCards = deckCards.reduce((sum, card) => sum + card.card_count, 0)

  // バリデーション関数
  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.title.trim()) {
      errors.push("デッキタイトルは必須です")
    }

    if (!formData.deck_name.trim()) {
      errors.push("デッキ名は必須です")
    }

    if (!formData.energy_type) {
      errors.push("エネルギータイプは必須です")
    }

    if (!formData.deck_description.trim()) {
      errors.push("デッキ説明は必須です")
    }

    if (totalCards !== 20) {
      errors.push(`デッキはちょうど20枚である必要があります（現在: ${totalCards}枚）`)
    }

    const invalidCards = deckCards.filter((card) => card.card_count < 1 || card.card_count > 2)
    if (invalidCards.length > 0) {
      errors.push("同じカードは1〜2枚までです")
    }

    return errors
  }

  // 保存処理
  const handleSave = async (publishStatus: boolean) => {
    const errors = validateForm()
    if (errors.length > 0) {
      toast.error("入力エラー", {
        description: errors.join("\n"),
      })
      return
    }

    setIsSaving(true)

    try {
      const deckPageData: DeckPageData = {
        title: formData.title,
        deck_name: formData.deck_name,
        deck_description: formData.deck_description,
        deck_badge: formData.deck_badge,
        thumbnail_image_url: formData.thumbnail_image_url,
        thumbnail_alt: formData.thumbnail_alt,
        section1_title: formData.section1_title,
        section2_title: formData.section2_title,
        section3_title: formData.section3_title,
        category: formData.category,
        energy_type: formData.energy_type,
        evaluation_title: formData.evaluation_title,
        tier_rank: formData.tier_rank,
        tier_name: formData.tier_name,
        tier_descriptions: formData.tier_descriptions,
        is_published: publishStatus,
        stats: formData.stats,
        strengths_weaknesses_list: formData.strengths_weaknesses_list,
        how_to_play_list: formData.how_to_play_list,
        deck_cards: deckCards.map((card) => ({
          card_id: card.card_id,
          card_count: card.card_count,
          display_order: card.display_order,
        })),
        strengths_weaknesses: strengthsWeaknesses.map((item) => ({
          title: item.title,
          description: item.description,
          image_urls: item.image_urls,
          display_order: item.display_order,
        })),
        play_steps: playSteps.map((step) => ({
          step_number: step.step_number,
          title: step.title,
          description: step.description,
          image_urls: step.image_urls,
        })),
      }

      let result
      if (isEditing && deck?.id) {
        result = await updateDeckPage(deck.id, deckPageData)
      } else {
        result = await createDeckPage(deckPageData)
      }

      if (result.success) {
        setLastSaved(new Date())
        toast.success(publishStatus ? "デッキページを公開しました" : "デッキページを下書き保存しました", {
          description: `${formData.deck_name}が正常に保存されました`,
        })

        // 公開した場合は、フォームの公開状態を更新
        if (publishStatus) {
          setFormData({ ...formData, is_published: true })
        }
      } else {
        toast.error("保存に失敗しました", {
          description: result.error || "不明なエラーが発生しました",
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("保存に失敗しました", {
        description: "予期しないエラーが発生しました",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCardSelection = (selectedCards: any[]) => {
    if (selectedCards.length > 0) {
      const newCard = selectedCards[0]
      const newDeckCard = {
        id: Date.now(), // 一時的なID
        card_id: Number.parseInt(newCard.id),
        card_name: newCard.name,
        pack_name: "パック名", // 実際のパック名は後で取得
        card_count: 1,
        display_order: deckCards.length,
      }
      setDeckCards([...deckCards, newDeckCard])
    }
    setIsCardSearchOpen(false)
  }

  const handleDeckCardSelection = (selectedCards: DeckCardType[]) => {
    const newDeckCards = selectedCards.map((card, index) => ({
      id: Date.now() + index, // 一時的なID
      card_id: Number.parseInt(card.id),
      card_name: card.name,
      pack_name: "パック名", // 実際のパック名は後で取得
      card_count: card.count,
      display_order: index,
    }))
    setDeckCards(newDeckCards)
    setIsDeckCardSelectionOpen(false)
  }

  const removeCard = (cardId: number) => {
    setDeckCards(deckCards.filter((card) => card.id !== cardId))
  }

  const updateCardCount = (cardId: number, newCount: number) => {
    setDeckCards(
      deckCards.map((card) =>
        card.id === cardId ? { ...card, card_count: Math.max(1, Math.min(2, newCount)) } : card,
      ),
    )
  }

  const updateDisplayOrder = (cardId: number, newOrder: number) => {
    setDeckCards(
      deckCards.map((card) => (card.id === cardId ? { ...card, display_order: Math.max(0, newOrder) } : card)),
    )
  }

  const addStrengthWeakness = () => {
    const newItem = {
      id: Date.now(),
      title: "",
      description: "",
      image_urls: [],
      display_order: strengthsWeaknesses.length + 1,
    }
    setStrengthsWeaknesses([...strengthsWeaknesses, newItem])
    setEditingStrengthWeakness(newItem)
    setIsEditingStrengthWeakness(true)
  }

  const editStrengthWeakness = (item: any) => {
    setEditingStrengthWeakness({ ...item })
    setIsEditingStrengthWeakness(true)
  }

  const saveStrengthWeakness = () => {
    if (!editingStrengthWeakness) return

    setStrengthsWeaknesses(
      strengthsWeaknesses.map((item) => (item.id === editingStrengthWeakness.id ? editingStrengthWeakness : item)),
    )
    setIsEditingStrengthWeakness(false)
    setEditingStrengthWeakness(null)
  }

  const deleteStrengthWeakness = (id: number) => {
    setStrengthsWeaknesses(strengthsWeaknesses.filter((item) => item.id !== id))
  }

  const addPlayStep = () => {
    const newStep = {
      id: Date.now(),
      step_number: playSteps.length + 1,
      title: "",
      description: "",
      image_urls: [],
    }
    setPlaySteps([...playSteps, newStep])
    setEditingPlayStep(newStep)
    setIsEditingPlayStep(true)
  }

  const editPlayStep = (step: any) => {
    setEditingPlayStep({ ...step })
    setIsEditingPlayStep(true)
  }

  const savePlayStep = () => {
    if (!editingPlayStep) return

    setPlaySteps(playSteps.map((step) => (step.id === editingPlayStep.id ? editingPlayStep : step)))
    setIsEditingPlayStep(false)
    setEditingPlayStep(null)
  }

  const deletePlayStep = (id: number) => {
    setPlaySteps(playSteps.filter((step) => step.id !== id))
  }

  const handleImageSelection = (selectedCards: any[]) => {
    if (!currentImageTarget) return

    // 選択されたカードから画像URLを取得（既に表示されている画像のURLを使用）
    const imageUrls = selectedCards.map((card) => {
      // カードオブジェクトから画像URLを取得
      // DetailedSearchModalから返されるカードオブジェクトの構造に応じて調整
      if (card.imageUrl) {
        return card.imageUrl
      }
      if (card.image_url) {
        return card.image_url
      }
      if (card.game8_image_url) {
        return card.game8_image_url
      }
      if (card.thumb_url) {
        return card.thumb_url
      }
      // フォールバック: カードIDから画像URLを構築
      return `https://kidyrurtyvxqokhszgko.supabase.co/storage/v1/object/public/card-images/full/l${card.id}.webp`
    })

    if (currentImageTarget.type === "strength" && editingStrengthWeakness) {
      setEditingStrengthWeakness({
        ...editingStrengthWeakness,
        image_urls: [...editingStrengthWeakness.image_urls, ...imageUrls],
      })
    } else if (currentImageTarget.type === "play" && editingPlayStep) {
      setEditingPlayStep({
        ...editingPlayStep,
        image_urls: [...editingPlayStep.image_urls, ...imageUrls],
      })
    }

    setIsImageSelectionOpen(false)
    setCurrentImageTarget(null)
  }

  const removeImage = (imageIndex: number) => {
    if (currentImageTarget?.type === "strength" && editingStrengthWeakness) {
      const newImageUrls = editingStrengthWeakness.image_urls.filter((_: any, index: number) => index !== imageIndex)
      setEditingStrengthWeakness({
        ...editingStrengthWeakness,
        image_urls: newImageUrls,
      })
    } else if (currentImageTarget?.type === "play" && editingPlayStep) {
      const newImageUrls = editingPlayStep.image_urls.filter((_: any, index: number) => index !== imageIndex)
      setEditingPlayStep({
        ...editingPlayStep,
        image_urls: newImageUrls,
      })
    }
  }

  const removePlayStepImage = (imageIndex: number) => {
    if (!editingPlayStep) return
    const newImageUrls = editingPlayStep.image_urls.filter((_: any, index: number) => index !== imageIndex)
    setEditingPlayStep({
      ...editingPlayStep,
      image_urls: newImageUrls,
    })
  }

  const removeStrengthWeaknessImage = (imageIndex: number) => {
    if (!editingStrengthWeakness) return
    const newImageUrls = editingStrengthWeakness.image_urls.filter((_: any, index: number) => index !== imageIndex)
    setEditingStrengthWeakness({
      ...editingStrengthWeakness,
      image_urls: newImageUrls,
    })
  }

  // 現在のデッキカードをDeckCardType形式に変換
  const currentDeckCardsForModal: DeckCardType[] = deckCards.map((card) => ({
    id: String(card.card_id),
    name: card.card_name,
    imageUrl: "", // 実際の画像URLは後で取得
    count: card.card_count,
  }))

  return (
    <div className="flex gap-6">
      {/* メインコンテンツ */}
      <div className="flex-1">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{isEditing ? "デッキ編集" : "デッキ作成"}</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                プレビュー
              </Button>
              <Button onClick={() => handleSave(false)} disabled={isSaving} variant="outline">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                下書き保存
              </Button>
              <Button onClick={() => handleSave(true)} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                公開
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="cards">カード構成</TabsTrigger>
              <TabsTrigger value="evaluation">評価設定</TabsTrigger>
              <TabsTrigger value="strengths">強み・弱み</TabsTrigger>
              <TabsTrigger value="strategy">プレイ方法</TabsTrigger>
            </TabsList>

            {/* 基本情報タブ */}
            <TabsContent value="basic" className="space-y-6">
              <DeckCard>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">デッキタイトル *</Label>
                    <Input
                      id="title"
                      placeholder="【ポケポケ】○○デッキのレシピと評価【ポケモンカードアプリ】"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deck_name">デッキ名 *</Label>
                      <Input
                        id="deck_name"
                        placeholder="○○デッキ"
                        value={formData.deck_name}
                        onChange={(e) => setFormData({ ...formData, deck_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="energy_type">エネルギータイプ *</Label>
                      <Select
                        value={formData.energy_type}
                        onValueChange={(value) => setFormData({ ...formData, energy_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="エネルギータイプを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="炎">🔥 炎タイプ</SelectItem>
                          <SelectItem value="水">💧 水タイプ</SelectItem>
                          <SelectItem value="草">🌿 草タイプ</SelectItem>
                          <SelectItem value="電気">⚡ 電気タイプ</SelectItem>
                          <SelectItem value="闘">👊 闘タイプ</SelectItem>
                          <SelectItem value="悪">🌙 悪タイプ</SelectItem>
                          <SelectItem value="鋼">⚙️ 鋼タイプ</SelectItem>
                          <SelectItem value="無色">⚪ 無色タイプ</SelectItem>
                          <SelectItem value="ドラゴン">🐉 ドラゴンタイプ</SelectItem>
                          <SelectItem value="エスパー">🔮 エスパータイプ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">デッキ説明 *</Label>
                    <Textarea
                      id="description"
                      placeholder="このデッキは初心者にも使いやすい構成になっています。序盤から少ないエネルギーでコスパ良くダメージを出していきます。"
                      rows={4}
                      value={formData.deck_description}
                      onChange={(e) => setFormData({ ...formData, deck_description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deck_badge">デッキバッジ</Label>
                      <Input
                        id="deck_badge"
                        placeholder="デッキバッジ表示名"
                        value={formData.deck_badge}
                        onChange={(e) => setFormData({ ...formData, deck_badge: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail_alt">サムネイル代替テキスト</Label>
                      <Input
                        id="thumbnail_alt"
                        placeholder="サムネイル画像の説明"
                        value={formData.thumbnail_alt}
                        onChange={(e) => setFormData({ ...formData, thumbnail_alt: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>サムネイル画像</Label>
                    <ImageUpload
                      value={formData.thumbnail_image_url}
                      onChange={(url) => setFormData({ ...formData, thumbnail_image_url: url })}
                      onRemove={() => setFormData({ ...formData, thumbnail_image_url: "" })}
                    />
                  </div>
                </CardContent>
              </DeckCard>

              <DeckCard>
                <CardHeader>
                  <CardTitle>セクションタイトル設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="section1_title">セクション1タイトル</Label>
                    <Input
                      id="section1_title"
                      placeholder="○○デッキのレシピと評価"
                      value={formData.section1_title}
                      onChange={(e) => setFormData({ ...formData, section1_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section2_title">セクション2タイトル</Label>
                    <Input
                      id="section2_title"
                      placeholder="○○デッキの強い点・弱い点"
                      value={formData.section2_title}
                      onChange={(e) => setFormData({ ...formData, section2_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section3_title">セクション3タイトル</Label>
                    <Input
                      id="section3_title"
                      placeholder="○○デッキの回し方"
                      value={formData.section3_title}
                      onChange={(e) => setFormData({ ...formData, section3_title: e.target.value })}
                    />
                  </div>
                </CardContent>
              </DeckCard>
            </TabsContent>

            {/* カード構成タブ */}
            <TabsContent value="cards" className="space-y-6">
              <DeckCard>
                <CardHeader>
                  <CardTitle>カード検索・追加</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsDeckCardSelectionOpen(true)} className="flex-1">
                      <Search className="h-4 w-4 mr-2" />
                      デッキ構成を編集
                    </Button>
                    <Button variant="outline" onClick={() => setIsCardSearchOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      1枚追加
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    「デッキ構成を編集」で一度に複数枚選択、「1枚追加」で個別にカードを追加できます
                  </p>
                </CardContent>
              </DeckCard>

              <DeckCard>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    現在のデッキ構成
                    <Badge variant={totalCards > 20 ? "destructive" : "outline"}>{totalCards}/20枚</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deckCards.map((card) => (
                      <div key={card.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                          <CardDisplay cardId={card.card_id} useThumb fill objectFit="cover" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{card.card_name}</div>
                          <div className="text-sm text-gray-600">{card.pack_name}</div>
                          <div className="text-xs text-gray-500">ID: {card.card_id}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">枚数:</Label>
                          <Input
                            type="number"
                            min="1"
                            max="2"
                            value={card.card_count}
                            onChange={(e) => updateCardCount(card.id, Number.parseInt(e.target.value) || 1)}
                            className="w-16"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">順序:</Label>
                          <Input
                            type="number"
                            min="0"
                            value={card.display_order}
                            onChange={(e) => updateDisplayOrder(card.id, Number.parseInt(e.target.value) || 0)}
                            className="w-16"
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => removeCard(card.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {deckCards.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>まだカードが追加されていません</p>
                        <p className="text-sm">上のボタンからカードを追加してください</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </DeckCard>

              <DeckCard>
                <CardHeader>
                  <CardTitle>デッキ統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className={`text-2xl font-bold ${totalCards > 20 ? "text-red-500" : "text-blue-600"}`}>
                        {totalCards}/20
                      </div>
                      <div className="text-sm text-gray-600">総枚数</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {deckCards.filter((card) => card.card_name.includes("ポケモン") || card.card_id < 2000).length}
                      </div>
                      <div className="text-sm text-gray-600">ポケモン</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {deckCards.filter((card) => card.card_name.includes("トレーナー")).length}
                      </div>
                      <div className="text-sm text-gray-600">トレーナー</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{deckCards.length}</div>
                      <div className="text-sm text-gray-600">種類数</div>
                    </div>
                  </div>

                  {totalCards > 20 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">
                        ⚠️ デッキの枚数が20枚を超えています。枚数を調整してください。
                      </p>
                    </div>
                  )}
                </CardContent>
              </DeckCard>
            </TabsContent>

            {/* 評価設定タブ */}
            <TabsContent value="evaluation" className="space-y-6">
              <DeckCard>
                <CardHeader>
                  <CardTitle>評価セクション設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="evaluation_title">評価タイトル</Label>
                    <Input
                      id="evaluation_title"
                      placeholder="○○デッキの評価"
                      value={formData.evaluation_title}
                      onChange={(e) => setFormData({ ...formData, evaluation_title: e.target.value })}
                    />
                  </div>
                </CardContent>
              </DeckCard>

              <DeckCard>
                <CardHeader>
                  <CardTitle>ティア設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ティアランク</Label>
                      <Select
                        value={formData.tier_rank}
                        onValueChange={(value) => setFormData({ ...formData, tier_rank: value })}
                      >
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
                    <div className="space-y-2">
                      <Label>ティア名</Label>
                      <Input
                        placeholder="Tier1"
                        value={formData.tier_name}
                        onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>ティア説明 (複数追加可能)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newDescriptions = [...formData.tier_descriptions, ""]
                          setFormData({ ...formData, tier_descriptions: newDescriptions })
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        説明を追加
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.tier_descriptions.map((description, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="ティアの特徴や説明を入力"
                            value={description}
                            onChange={(e) => {
                              const newDescriptions = [...formData.tier_descriptions]
                              newDescriptions[index] = e.target.value
                              setFormData({ ...formData, tier_descriptions: newDescriptions })
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newDescriptions = formData.tier_descriptions.filter((_, i) => i !== index)
                              setFormData({ ...formData, tier_descriptions: newDescriptions })
                            }}
                            disabled={formData.tier_descriptions.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </DeckCard>

              <DeckCard>
                <CardHeader>
                  <CardTitle>ステータス評価</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(formData.stats).map(([key, value]) => {
                    const labels = {
                      accessibility: "アクセス性",
                      speed: "スピード",
                      power: "パワー",
                      durability: "耐久性",
                      stability: "安定性",
                    }
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between">
                          <Label>{labels[key as keyof typeof labels]}</Label>
                          <span className="text-sm text-gray-600">{value}/5</span>
                        </div>
                        <Slider
                          value={[value]}
                          onValueChange={(newValue) =>
                            setFormData({
                              ...formData,
                              stats: { ...formData.stats, [key]: newValue[0] },
                            })
                          }
                          max={5}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                          <span>4</span>
                          <span>5</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </DeckCard>
            </TabsContent>

            {/* 強み・弱みタブ */}
            <TabsContent value="strengths" className="space-y-6">
              <DeckCard>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    強み・弱み項目
                    <Button onClick={addStrengthWeakness}>
                      <Plus className="h-4 w-4 mr-2" />
                      項目を追加
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {strengthsWeaknesses.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">
                            {index + 1}. {item.title || "新しい項目"}
                          </h4>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => editStrengthWeakness(item)}>
                              編集
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteStrengthWeakness(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description || "説明が入力されていません"}</p>
                        <div className="text-xs text-gray-400">
                          画像: {item.image_urls.length > 0 ? `${item.image_urls.length}枚` : "なし"} | 表示順序:{" "}
                          {item.display_order}
                        </div>
                        {item.image_urls.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {item.image_urls.slice(0, 3).map((url: string, imgIndex: number) => (
                              <img
                                key={imgIndex}
                                src={url || "/placeholder.svg"}
                                alt=""
                                className="w-12 h-12 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg"
                                }}
                              />
                            ))}
                            {item.image_urls.length > 3 && (
                              <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs">
                                +{item.image_urls.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {strengthsWeaknesses.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>まだ強み・弱み項目が追加されていません</p>
                        <p className="text-sm">上のボタンから項目を追加してください</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </DeckCard>

              <DeckCard>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    強み・弱み簡易リスト
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newList = [...formData.strengths_weaknesses_list, ""]
                        setFormData({ ...formData, strengths_weaknesses_list: newList })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      項目を追加
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.strengths_weaknesses_list.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="強み・弱みの簡易説明"
                          value={item}
                          onChange={(e) => {
                            const newList = [...formData.strengths_weaknesses_list]
                            newList[index] = e.target.value
                            setFormData({ ...formData, strengths_weaknesses_list: newList })
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newList = formData.strengths_weaknesses_list.filter((_, i) => i !== index)
                            setFormData({ ...formData, strengths_weaknesses_list: newList })
                          }}
                          disabled={formData.strengths_weaknesses_list.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </DeckCard>
            </TabsContent>

            {/* プレイ方法タブ */}
            <TabsContent value="strategy" className="space-y-6">
              <DeckCard>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    プレイステップ
                    <Button onClick={addPlayStep}>
                      <Plus className="h-4 w-4 mr-2" />
                      ステップを追加
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {playSteps.map((step, index) => (
                      <div key={step.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">
                            STEP {step.step_number}: {step.title || "新しいステップ"}
                          </h4>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => editPlayStep(step)}>
                              編集
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deletePlayStep(step.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{step.description || "説明が入力されていません"}</p>
                        <div className="text-xs text-gray-400">
                          画像: {step.image_urls.length > 0 ? `${step.image_urls.length}枚` : "なし"}
                        </div>
                        {step.image_urls.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {step.image_urls.slice(0, 3).map((url: string, imgIndex: number) => (
                              <img
                                key={imgIndex}
                                src={url || "/placeholder.svg"}
                                alt=""
                                className="w-12 h-12 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg"
                                }}
                              />
                            ))}
                            {step.image_urls.length > 3 && (
                              <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs">
                                +{step.image_urls.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {playSteps.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>まだプレイステップが追加されていません</p>
                        <p className="text-sm">上のボタンからステップを追加してください</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </DeckCard>

              <DeckCard>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    プレイ方法簡易リスト
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newList = [...formData.how_to_play_list, ""]
                        setFormData({ ...formData, how_to_play_list: newList })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      項目を追加
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.how_to_play_list.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="プレイ方法の簡易説明"
                          value={item}
                          onChange={(e) => {
                            const newList = [...formData.how_to_play_list]
                            newList[index] = e.target.value
                            setFormData({ ...formData, how_to_play_list: newList })
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newList = formData.how_to_play_list.filter((_, i) => i !== index)
                            setFormData({ ...formData, how_to_play_list: newList })
                          }}
                          disabled={formData.how_to_play_list.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </DeckCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* サイドバー */}
      <div className="w-80">
        <DeckCard className="sticky top-6">
          <CardHeader>
            <CardTitle>設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>公開設定</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>{formData.is_published ? "公開" : "下書き"}</Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>カテゴリー</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tier">Tier</SelectItem>
                  <SelectItem value="featured">Featured (注目)</SelectItem>
                  <SelectItem value="new-pack">New Pack (新パック)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>保存状況</Label>
              <div className="text-sm text-gray-600">
                <div>最終保存: {lastSaved ? lastSaved.toLocaleString("ja-JP") : "未保存"}</div>
                <div>自動保存: OFF</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button className="w-full" onClick={() => handleSave(false)} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                下書き保存
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                プレビュー
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                公開
              </Button>
            </div>
          </CardContent>
        </DeckCard>
      </div>

      {/* プレビューモーダル */}
      <DeckPreviewModal
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        formData={formData}
        deckCards={deckCards}
        strengthsWeaknesses={strengthsWeaknesses}
        playSteps={playSteps}
      />

      {/* 1枚追加用のカード検索モーダル */}
      <DetailedSearchModal
        isOpen={isCardSearchOpen}
        onOpenChange={setIsCardSearchOpen}
        onSelectionComplete={handleCardSelection}
        maxSelection={1}
        modalTitle="デッキに追加するカードを選択"
      />

      {/* デッキ構成用のカード選択モーダル */}
      <DeckCardSelectionModal
        isOpen={isDeckCardSelectionOpen}
        onOpenChange={setIsDeckCardSelectionOpen}
        onSelectionComplete={handleDeckCardSelection}
        initialSelectedCards={currentDeckCardsForModal}
        modalTitle="デッキ構成を編集（最大20枚）"
      />

      {/* 強み・弱み編集モーダル */}
      {isEditingStrengthWeakness && editingStrengthWeakness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">強み・弱み項目を編集</h3>
              <Button variant="outline" size="sm" onClick={() => setIsEditingStrengthWeakness(false)}>
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>タイトル *</Label>
                <Input
                  placeholder="例: 安定した試合展開ができる"
                  value={editingStrengthWeakness.title}
                  onChange={(e) =>
                    setEditingStrengthWeakness({
                      ...editingStrengthWeakness,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>説明 *</Label>
                <Textarea
                  placeholder="詳細な説明を入力してください"
                  rows={4}
                  value={editingStrengthWeakness.description}
                  onChange={(e) =>
                    setEditingStrengthWeakness({
                      ...editingStrengthWeakness,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>表示順序</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingStrengthWeakness.display_order}
                  onChange={(e) =>
                    setEditingStrengthWeakness({
                      ...editingStrengthWeakness,
                      display_order: Number.parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>関連画像</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentImageTarget({ type: "strength", id: editingStrengthWeakness.id })
                      setIsImageSelectionOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    画像を追加
                  </Button>
                </div>

                {editingStrengthWeakness.image_urls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {editingStrengthWeakness.image_urls.map((url: string, index: number) => (
                      <div key={index} className="relative">
                        <img
                          src={url || "/placeholder.svg"}
                          alt=""
                          className="w-full h-20 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600"
                          onClick={() => removeStrengthWeaknessImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditingStrengthWeakness(false)}>
                キャンセル
              </Button>
              <Button onClick={saveStrengthWeakness}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* プレイステップ編集モーダル */}
      {isEditingPlayStep && editingPlayStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">プレイステップを編集</h3>
              <Button variant="outline" size="sm" onClick={() => setIsEditingPlayStep(false)}>
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ステップ番号</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingPlayStep.step_number}
                  onChange={(e) =>
                    setEditingPlayStep({
                      ...editingPlayStep,
                      step_number: Number.parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>タイトル *</Label>
                <Input
                  placeholder="例: 序盤から積極的に攻撃"
                  value={editingPlayStep.title}
                  onChange={(e) =>
                    setEditingPlayStep({
                      ...editingPlayStep,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>説明 *</Label>
                <Textarea
                  placeholder="詳細な説明を入力してください"
                  rows={4}
                  value={editingPlayStep.description}
                  onChange={(e) =>
                    setEditingPlayStep({
                      ...editingPlayStep,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>関連画像</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentImageTarget({ type: "play", id: editingPlayStep.id })
                      setIsImageSelectionOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    画像を追加
                  </Button>
                </div>

                {editingPlayStep.image_urls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {editingPlayStep.image_urls.map((url: string, index: number) => (
                      <div key={index} className="relative">
                        <img
                          src={url || "/placeholder.svg"}
                          alt=""
                          className="w-full h-20 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600"
                          onClick={() => removePlayStepImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditingPlayStep(false)}>
                キャンセル
              </Button>
              <Button onClick={savePlayStep}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* 画像選択用のカード検索モーダル */}
      <DetailedSearchModal
        isOpen={isImageSelectionOpen}
        onOpenChange={setIsImageSelectionOpen}
        onSelectionComplete={handleImageSelection}
        maxSelection={5}
        modalTitle="関連画像として使用するカードを選択"
      />
    </div>
  )
}
