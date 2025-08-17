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
import { Save, Eye, Upload, Plus, Trash2, GripVertical, Search } from "lucide-react"
import DetailedSearchModal from "@/components/detailed-search-modal"

interface DeckEditorProps {
  deck?: any
  isEditing?: boolean
}

export function DeckEditor({ deck, isEditing = false }: DeckEditorProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isCardSearchOpen, setIsCardSearchOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: deck?.title || "",
    deck_name: deck?.deck_name || "",
    deck_description: deck?.deck_description || "",
    deck_badge: deck?.deck_badge || "",
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

  const totalCards = deckCards.reduce((sum, card) => sum + card.card_count, 0)

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

  return (
    <div className="flex gap-6">
      {/* メインコンテンツ */}
      <div className="flex-1">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{isEditing ? "デッキ編集" : "デッキ作成"}</h1>
            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                プレビュー
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                保存
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
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">画像をドラッグ&ドロップまたはクリックしてアップロード</p>
                      <Button variant="outline" className="mt-2 bg-transparent">
                        ファイルを選択
                      </Button>
                    </div>
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
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="カード名またはIDで検索..."
                        className="pl-10"
                        readOnly
                        onClick={() => setIsCardSearchOpen(true)}
                      />
                    </div>
                    <Button onClick={() => setIsCardSearchOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      カード検索
                    </Button>
                  </div>
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
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs">📷</span>
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
                            max="4"
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
                        <p className="text-sm">上の検索ボタンからカードを追加してください</p>
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
                    <Button>
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
                            {index + 1}. {item.title}
                          </h4>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              編集
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="text-xs text-gray-400">
                          画像: {item.image_urls.length > 0 ? `${item.image_urls.length}枚` : "なし"} | 表示順序:{" "}
                          {item.display_order}
                        </div>
                      </div>
                    ))}
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
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      ステップを追加
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {playSteps.map((step) => (
                      <div key={step.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">
                            STEP {step.step_number}: {step.title}
                          </h4>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              編集
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        <div className="text-xs text-gray-400">
                          画像: {step.image_urls.length > 0 ? `${step.image_urls.length}枚` : "なし"}
                        </div>
                      </div>
                    ))}
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
                <div>最終保存: 未保存</div>
                <div>自動保存: ON</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                下書き保存
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <Eye className="h-4 w-4 mr-2" />
                プレビュー
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                公開
              </Button>
            </div>
          </CardContent>
        </DeckCard>
      </div>

      {/* カード検索モーダル */}
      <DetailedSearchModal
        isOpen={isCardSearchOpen}
        onOpenChange={setIsCardSearchOpen}
        onSelectionComplete={handleCardSelection}
        maxSelection={1}
        modalTitle="デッキに追加するカードを選択"
      />
    </div>
  )
}
