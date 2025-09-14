"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Star, FileText, Heart } from "lucide-react"
import confetti from "canvas-confetti"

interface SurveyData {
  q1_primary: string
  q2_values: string[]
  q3_features: string[]
  q4_intent: number | null
}

export default function MatchingSurvey() {
  const [hasResponse, setHasResponse] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThanks, setShowThanks] = useState(false)
  const [formData, setFormData] = useState<SurveyData>({
    q1_primary: "",
    q2_values: [],
    q3_features: [],
    q4_intent: null,
  })

  useEffect(() => {
    checkSurveyStatus()
  }, [])

  const checkSurveyStatus = async () => {
    try {
      // まずlocalStorageをチェック
      if (typeof window !== "undefined" && localStorage.getItem("matching_survey_done") === "1") {
        setShowThanks(true)
        setHasResponse(true)
        return
      }

      const response = await fetch("/api/survey/me")
      if (response.ok) {
        const data = await response.json()
        setHasResponse(data.hasResponse)
        if (data.hasResponse) {
          setShowThanks(true)
        }
      }
    } catch (error) {
      console.error("Survey status check error:", error)
      setHasResponse(false)
    }
  }

  const handleQ2Change = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      q2_values: checked ? [...prev.q2_values, value] : prev.q2_values.filter((v) => v !== value),
    }))
  }

  const handleQ3Change = (value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      q3_features: checked ? [...prev.q3_features, value] : prev.q3_features.filter((v) => v !== value),
    }))
  }

  const handleSubmit = async () => {
    if (!formData.q1_primary || formData.q2_values.length === 0 || formData.q3_features.length === 0) {
      toast({
        title: "未回答の項目があります。",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // コンフェッティアニメーション
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        // localStorageにセット
        if (typeof window !== "undefined") {
          localStorage.setItem("matching_survey_done", "1")
        }

        // 1.5秒後にお礼カードに切り替え
        setTimeout(() => {
          setShowThanks(true)
        }, 1500)
      } else {
        toast({
          title: data.error || "送信中にエラーが発生しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "送信中にエラーが発生しました。時間をおいて再度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasResponse === null) {
    return null // ローディング中
  }

  if (showThanks) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <div className="bg-green-100 p-4 rounded-full">
            <Heart className="h-12 w-12 text-green-500" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-900">ご回答ありがとうございました！</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              いただいたご意見を参考に、より良いマッチング体験をお届けします。公開まで少々お待ちください。
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasResponse) {
    return null // 既に回答済みの場合は何も表示しない
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
          <FileText className="h-8 w-8 text-blue-500" />
        </div>
        <CardTitle className="text-xl font-bold text-slate-900">💡 ご意見をお聞かせください</CardTitle>
        <p className="text-slate-600 text-sm">マッチング機能をより良くするため、1分アンケートにご協力ください。</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Q1 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Q1. マッチング相手を探すときに最も重視するものは？ <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={formData.q1_primary}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, q1_primary: value }))}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="want_match" id="want_match" />
              <Label htmlFor="want_match" className="text-sm">
                欲しいカードが一致
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="offer_match" id="offer_match" />
              <Label htmlFor="offer_match" className="text-sm">
                譲れるカードが一致
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="facet_search" id="facet_search" />
              <Label htmlFor="facet_search" className="text-sm">
                レアリティ／タイプなどで検索できること
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="direct_specify" id="direct_specify" />
              <Label htmlFor="direct_specify" className="text-sm">
                フレンドIDなどで直接指定できること
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q2 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Q2. マッチングで期待する体験は？ <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-2">
            {[
              { value: "speed", label: "すぐに相手を見つけたい（スピード重視）" },
              { value: "trust", label: "安心できる相手と交換したい（信頼性重視）" },
              { value: "rare_efficiency", label: "レア／需要の高いカードを効率よく交換したい" },
              { value: "social", label: "交流のきっかけにしたい（フレンドづくり）" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`q2_${option.value}`}
                  checked={formData.q2_values.includes(option.value)}
                  onCheckedChange={(checked) => handleQ2Change(option.value, checked as boolean)}
                />
                <Label htmlFor={`q2_${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Q3 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Q3. マッチング後に欲しいサポート機能は？ <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-2">
            {[
              { value: "chat", label: "アプリ内チャット" },
              { value: "notify", label: "マッチ成立の通知（プッシュ）" },
              { value: "review", label: "レビュー・評価で信頼度を可視化" },
              { value: "history", label: "トレード履歴の自動保存" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`q3_${option.value}`}
                  checked={formData.q3_features.includes(option.value)}
                  onCheckedChange={(checked) => handleQ3Change(option.value, checked as boolean)}
                />
                <Label htmlFor={`q3_${option.value}`} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Q4 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Q4. この機能をどのくらい使いたいですか？</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, q4_intent: rating }))}
                className="p-1"
              >
                <Star
                  className={`h-6 w-6 ${
                    formData.q4_intent && formData.q4_intent >= rating
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "送信中..." : "送信する"}
        </Button>
      </CardContent>
    </Card>
  )
}
