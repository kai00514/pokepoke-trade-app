// Survey option constants and type definitions

export type MatchingPrimaryPref = "want_match" | "offer_match" | "facet_search" | "direct_specify"

export type Q2Value = "speed" | "trust" | "rare_efficiency" | "social"
export type Q3Feature = "chat" | "notify" | "review" | "history"

export interface SurveyResponse {
  q1_primary: MatchingPrimaryPref
  q2_values: Q2Value[]
  q3_features: Q3Feature[]
  q4_intent?: number | null
}

// Q1 options mapping
export const Q1_OPTIONS: { value: MatchingPrimaryPref; label: string }[] = [
  { value: "want_match", label: "欲しいカードが一致" },
  { value: "offer_match", label: "譲れるカードが一致" },
  { value: "facet_search", label: "レアリティ／タイプなどで検索できること" },
  { value: "direct_specify", label: "フレンドIDなどで直接指定できること" },
]

// Q2 options mapping
export const Q2_OPTIONS: { value: Q2Value; label: string }[] = [
  { value: "speed", label: "すぐに相手を見つけたい（スピード重視）" },
  { value: "trust", label: "安心できる相手と交換したい（信頼性重視）" },
  { value: "rare_efficiency", label: "レア／需要の高いカードを効率よく交換したい" },
  { value: "social", label: "交流のきっかけにしたい（フレンドづくり）" },
]

// Q3 options mapping
export const Q3_OPTIONS: { value: Q3Feature; label: string }[] = [
  { value: "chat", label: "アプリ内チャット" },
  { value: "notify", label: "マッチ成立の通知（プッシュ）" },
  { value: "review", label: "レビュー・評価で信頼度を可視化" },
  { value: "history", label: "トレード履歴の自動保存" },
]

// Q4 star ratings
export const Q4_OPTIONS = [
  { value: 5, label: "★★★★★" },
  { value: 4, label: "★★★★☆" },
  { value: 3, label: "★★★☆☆" },
  { value: 2, label: "★★☆☆☆" },
  { value: 1, label: "★☆☆☆☆" },
]
