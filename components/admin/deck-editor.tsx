"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, Eye, Upload, Plus, Trash2, GripVertical, Search } from "lucide-react"

interface DeckEditorProps {
  deck?: any
  isEditing?: boolean
}

export function DeckEditor({ deck, isEditing = false }: DeckEditorProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [formData, setFormData] = useState({
    title: deck?.title || "",
    deck_name: deck?.deck_name || "",
    deck_description: deck?.deck_description || "",
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
  })

  const [deckCards, setDeckCards] = useState([
    {
      id: 1,
      card_id: 1533,
      card_name: "ピカチュウ",
      pack_name: "拡張パック「スカーレット&バイオレット」",
      quantity: 4,
    },
    { id: 2, card_id: 1532, card_name: "ライチュウ", pack_name: "拡張パック「クレイバースト」", quantity: 2 },
  ])

  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState([
    {
      id: 1,
      title: "安定した試合展開ができる",
      description: "グラジオによりタイプ：ヌルとシルヴァディを手札に揃えやすくなっています。",
      images: [],
    },
    {
      id: 2,
      title: "デッキの拡張性が高い",
      description: "シルヴァディは無色エネルギーでワザを使えるため、サブアタッカーに様々な選択肢を取ることができます。",
      images: [],
    },
  ])

  const [playSteps, setPlaySteps] = useState([
    {
      id: 1,
      step_number: 1,
      title: "序盤から積極的に攻撃",
      description: "序盤からシルヴァディで攻撃していきます。グラジオでシルヴァディをサーチして素早く進化させましょう。",
      images: [],
    },
    {
      id: 2,
      step_number: 2,
      title: "サブアタッカーを育成",
      description: "シルヴァディで戦っている間にベンチでサブアタッカーを育成しましょう。",
      images: [],
    },
  ])

  const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0)

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
              <Card>
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
              </Card>
            </TabsContent>

            {/* カード構成タブ */}
            <TabsContent value="cards" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>カード検索・追加</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input placeholder="カード名またはIDで検索..." className="pl-10" />
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      追加
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    現在のデッキ構成
                    <Badge variant="outline">{totalCards}/60枚</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deckCards.map((card) => (
                      <div key={card.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">📷</div>
                        <div className="flex-1">
                          <div className="font-medium">{card.card_name}</div>
                          <div className="text-sm text-gray-600">{card.pack_name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label>枚数:</Label>
                          <Input type="number" min="1" max="4" value={card.quantity} className="w-16" />
                        </div>
                        <Button variant="outline" size="sm">
                          編集
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>デッキ統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{totalCards}/60</div>
                      <div className="text-sm text-gray-600">総枚数</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">15</div>
                      <div className="text-sm text-gray-600">ポケモン</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">5</div>
                      <div className="text-sm text-gray-600">トレーナー</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 評価設定タブ */}
            <TabsContent value="evaluation" className="space-y-6">
              <Card>
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
              </Card>

              <Card>
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
              </Card>

              <Card>
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
              </Card>
            </TabsContent>

            {/* 強み・弱みタブ */}
            <TabsContent value="strengths" className="space-y-6">
              <Card>
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
                          画像: {item.images.length > 0 ? `${item.images.length}枚` : "なし"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* プレイ方法タブ */}
            <TabsContent value="strategy" className="space-y-6">
              <Card>
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
                          画像: {step.images.length > 0 ? `${step.images.length}枚` : "なし"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* サイドバー */}
      <div className="w-80">
        <Card className="sticky top-6">
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
        </Card>
      </div>
    </div>
  )
}
