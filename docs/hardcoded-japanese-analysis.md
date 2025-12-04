# ハードコードされた日本語テキスト詳細分析

調査日: 2025-11-29

## サマリー

- **対象ファイル数**: 36
- **日本語テキスト総数**: 約350件
- **既に多言語対応済み**: footer.tsx, header.tsx, login-prompt.tsx, notification-dropdown.tsx (一部)
- **優先度の高いファイル**: コメント機能、トレード詳細、デッキ関連コンポーネント

## 重要な発見

- **既存の翻訳システム**: `locales/ja/` 配下に `common.json`, `auth.json`, `messages.json` などが存在
- **一部対応済み**: Footer, Header, LoginPrompt, NotificationDropdown で `useTranslations()` を使用
- **未対応の主要機能**: コメントシステム、デッキ評価、マッチングサーベイ、トレード詳細

---

## ファイル別詳細

### 1. app/[locale]/auth/login/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 2. app/[locale]/collages/[id]/collage-page-client.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 3. app/[locale]/collages/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 4. app/[locale]/contact/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 5. app/[locale]/content/[id]/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 6. app/[locale]/decks/[id]/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 7. app/[locale]/decks/create/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 8. app/[locale]/decks/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 9. app/[locale]/favorites/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 10. app/[locale]/history/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 11. app/[locale]/info/news/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 12. app/[locale]/info/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 13. app/[locale]/layout.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 14. app/[locale]/lists/create/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 15. app/[locale]/lists/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 16. app/[locale]/matching/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 17. app/[locale]/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 18. app/[locale]/trades/[id]/opengraph-image.tsx

**日本語テキスト数**: 5件

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 49 | "求めるカード:" | trades.wantedCards | ★★★ |
| 59 | "カードなし" | trades.noCards | ★★★ |
| 71 | "譲れるカード:" | trades.offeredCards | ★★★ |
| 81 | "カードなし" | trades.noCards | ★★★ |
| 91 | "ポケモンカードトレード募集" | trades.ogTitle | ★★ |

**推奨アクション**: `locales/ja/trades.json` を作成し、OGP画像用のテキストを管理

---

### 19. app/[locale]/trades/[id]/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 20. app/[locale]/trades/create/page.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 21. components/DeckComments.tsx

**日本語テキスト数**: 27件 ⚠️

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 60 | "匿名ユーザー" | comments.anonymousUser | ★★★ |
| 69 | "エラー" | errors.title | ★★★ |
| 70 | "コメントの読み込みに失敗しました。" | comments.loadError | ★★★ |
| 75 | "エラー" | errors.title | ★★★ |
| 75 | "予期しないエラーが発生しました。" | errors.unexpected | ★★★ |
| 88 | "入力エラー" | errors.inputError | ★★★ |
| 88 | "コメントを入力してください。" | comments.pleaseEnter | ★★★ |
| 97 | "ゲスト" | comments.guest | ★★★ |
| 104 | "匿名ユーザー" | comments.anonymousUser | ★★★ |
| 111 | "たった今" | comments.justNow | ★★★ |
| 150 | "投稿完了" | comments.posted | ★★★ |
| 151 | "ゲストとしてコメントを投稿しました" | comments.postedAsGuest | ★★★ |
| 151 | "コメントを投稿しました" | comments.postedSuccess | ★★★ |
| 155 | "コメントの投稿に失敗しました" | comments.postError | ★★★ |
| 161 | "コメント投稿エラー" | comments.postErrorTitle | ★★★ |
| 163 | "コメントの投稿に失敗しました。もう一度お試しください。" | comments.postErrorRetry | ★★★ |
| 173 | "入力エラー" | errors.inputError | ★★★ |
| 173 | "コメントを入力してください。" | comments.pleaseEnter | ★★★ |
| 192 | "コメント" | comments.title | ★★★ |
| 204 | "コメント ({comments.length})" | comments.titleWithCount | ★★★ |
| 219 | "ゲスト" | comments.guest | ★★★ |
| 229 | "まだコメントはありません。" | comments.noComments | ★★★ |
| 234 | "ログイン中: {user?.user_metadata?.display_name || user?.email}" | comments.loggedInAs | ★★ |
| 240 | "コメントを入力してください..." | comments.placeholder | ★★★ |
| 240 | "ゲストとしてコメントを入力してください..." | comments.placeholderGuest | ★★★ |
| 259 | "投稿" | buttons.post | ★★★ |

**推奨アクション**: `locales/ja/comments.json` を新規作成し、コメント機能専用の翻訳を管理

---

### 22. components/MatchingSurvey.tsx

**日本語テキスト数**: 18件 ⚠️

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 94 | "未回答の項目があります。" | survey.incompleteError | ★★★ |
| 128 | "送信中にエラーが発生しました。時間をおいて再度お試しください。" | survey.submitError | ★★★ |
| 144 | "ご意見をお聞かせください" | survey.title | ★★★ |
| 146 | "マッチング機能をより良くするため、1分アンケートにご協力ください。" | survey.subtitle | ★★★ |
| 155 | "Q1. マッチング相手を探すときに最も重視するものは？" | survey.q1.title | ★★★ |
| 175 | "Q2. マッチングで期待する体験は？（複数選択可）" | survey.q2.title | ★★★ |
| 196 | "Q3. マッチング後に欲しいサポート機能は？（複数選択可）" | survey.q3.title | ★★★ |
| 216 | "Q4. この機能をどのくらい使いたいですか？（任意）" | survey.q4.title | ★★ |
| 239 | "送信中..." | buttons.submitting | ★★★ |
| 239 | "送信する" | buttons.submit | ★★★ |

**推奨アクション**: `locales/ja/survey.json` を新規作成

---

### 23. components/MatchingThanks.tsx

**日本語テキスト数**: 2件

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 14 | "ご回答ありがとうございました！" | survey.thankYou | ★★★ |
| 16 | "いただいたご意見を参考に、より良いマッチング体験をお届けします。公開まで少々お待ちください。" | survey.thankYouMessage | ★★★ |

---

### 24. components/TradeComments.tsx

**日本語テキスト数**: 10件 ⚠️

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 53 | "コメント" | comments.title | ★★★ |
| 59 | "コメントを入力" | comments.placeholder | ★★★ |
| 69 | "投稿" | buttons.post | ★★★ |
| 74 | "読み込み中..." | common.loading | ★★★ |
| 79 | "ゲスト" | comments.guest | ★★★ |
| 79 | "ユーザー" | common.user | ★★★ |
| 81 | "編集済み" | comments.edited | ★★ |

**推奨アクション**: comments.json に統合

---

### 25. components/deck-card.tsx

**日本語テキスト数**: 12件 ⚠️

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 128 | "無題のデッキ" | decks.untitled | ★★★ |
| 142 | "Tier" | decks.categories.tier | ★★ |
| 144 | "注目" | decks.categories.featured | ★★ |
| 146 | "新パック" | decks.categories.newPack | ★★ |
| 152 | "投稿" | decks.categories.post | ★★ |
| 247 | "エラー" | errors.title | ★★★ |
| 346 | "エラー" | errors.title | ★★★ |
| 365 | "エラー" | errors.title | ★★★ |
| 365 | "操作に失敗しました" | errors.operationFailed | ★★★ |
| 434 | "更新: {new Date(updatedDate).toLocaleDateString("ja-JP")}" | decks.updated | ★★★ |
| 447 | "いいね" | actions.like | ★★★ |
| 467 | "お気に入り" | actions.favorite | ★★★ |
| 478 | "コメント数" | decks.commentCount | ★★ |

**推奨アクション**: `locales/ja/decks.json` を新規作成

---

### 26. components/deck-cards-grid.tsx

**日本語テキスト数**: 4件

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 29 | "デッキレシピ情報がありません" | decks.noRecipe | ★★ |
| 62 | "タイプ" | decks.type | ★★ |
| 74 | "カード" | cards.card | ★★ |

---

### 27. components/deck-composition-chart.tsx

**日本語テキスト数**: 5件

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 40 | "ポケモン" | cards.types.pokemon | ★★★ |
| 41 | "トレーナーズ" | cards.types.trainers | ★★★ |
| 42 | "エネルギー" | cards.types.energy | ★★★ |
| 47 | "デッキにカードがありません。" | decks.noCards | ★★ |
| 76 | "{value}枚" | cards.count | ★★ |

---

### 28. components/deck-evaluation.tsx

**日本語テキスト数**: 21件 ⚠️

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 50 | "ユーザー評価の確認に失敗しました" | evaluation.checkError | ★★ |
| 57 | "エラー" | errors.title | ★★★ |
| 58 | "ユーザー評価の確認中にエラーが発生しました。" | evaluation.checkErrorDetail | ★★ |
| 72 | "ログインが必要です" | errors.loginRequired | ★★★ |
| 73 | "デッキを評価するにはログインしてください。" | evaluation.loginPrompt | ★★ |
| 80 | "既に評価済みです" | evaluation.alreadyRated | ★★ |
| 81 | "このデッキは既に評価されています。" | evaluation.alreadyRatedDetail | ★★ |
| 104 | "評価の送信に失敗しました" | evaluation.submitError | ★★ |
| 113 | "評価を送信しました" | evaluation.submitSuccess | ★★★ |
| 114 | "あなたの評価 {userScore[0]} 点が反映されました。" | evaluation.submitSuccessDetail | ★★ |
| 119 | "エラー" | errors.title | ★★★ |
| 120 | "評価の送信中にエラーが発生しました。" | evaluation.submitErrorDetail | ★★ |
| 146 | "集めやすさ" | evaluation.stats.accessibility | ★★★ |
| 147 | "速度" | evaluation.stats.speed | ★★★ |
| 148 | "火力" | evaluation.stats.power | ★★★ |
| 149 | "耐久" | evaluation.stats.durability | ★★★ |
| 150 | "安定" | evaluation.stats.stability | ★★★ |
| 266 | "デッキ特徴" | evaluation.deckFeatures | ★★★ |

**推奨アクション**: `locales/ja/evaluation.json` を新規作成

---

### 29. components/deck-horizontal-row.tsx

**日本語テキスト数**: 13件

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 106 | "無題のデッキ" | decks.untitled | ★★★ |
| 115 | "Tier" | decks.categories.tier | ★★ |
| 117 | "注目" | decks.categories.featured | ★★ |
| 119 | "新パック" | decks.categories.newPack | ★★ |
| 122 | "投稿" | decks.categories.post | ★★ |
| 159 | "プレースホルダー" | common.placeholder | ★★ |
| 181 | "不明なカード" | cards.unknown | ★★ |
| 192 | "エラー" | errors.title | ★★★ |
| 222 | "エラー" | errors.title | ★★★ |
| 233 | "エラー" | errors.title | ★★★ |
| 233 | "操作に失敗しました" | errors.operationFailed | ★★★ |
| 262 | "エラー" | errors.title | ★★★ |
| 270 | "エラー" | errors.title | ★★★ |
| 270 | "操作に失敗しました" | errors.operationFailed | ★★★ |
| 288 | "更新: {new Date(updatedDate).toLocaleDateString("ja-JP")}" | decks.updated | ★★★ |
| 301 | "デッキのカード一覧 横スクロール" | decks.cardListLabel | ★★ |
| 323 | "カード" | cards.card | ★★ |
| 348 | "いいね" | actions.like | ★★★ |
| 349 | "いいね" | actions.like | ★★★ |
| 367 | "お気に入り" | actions.favorite | ★★★ |
| 368 | "お気に入り" | actions.favorite | ★★★ |
| 378 | "コメント数" | decks.commentCount | ★★ |
| 379 | "コメント数" | decks.commentCount | ★★ |
| 388 | "詳細を見る" | buttons.viewDetails | ★★★ |

---

### 30. components/footer.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 31. components/header.tsx

**日本語テキスト数**: 17件（⚠️ 一部のみ多言語対応）

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 39 | "ユーザーアバター" | header.userAvatar | ★★ |
| 128 | "PokeLink ロゴ" | header.logoAlt | ★★ |
| 135 | "新規投稿作成" | buttons.createPost | ★★★ |
| 138 | "新規投稿作成" | buttons.createPost | ★★★ |
| 147 | "通知 ({unreadCount}件の未読)" | notifications.unreadCount | ★★★ |
| 164 | "ユーザーメニューを開く" | header.openUserMenu | ★★★ |
| 200 | "オンライン" | user.online | ★★ |
| 216 | "ポケポケID登録" | buttons.registerPokepokeId | ★★★ |
| 219 | "あなた専用のIDを設定" | user.setYourId | ★★ |
| 234 | "ユーザー名登録" | buttons.registerUsername | ★★★ |
| 237 | "表示名をカスタマイズ" | user.customizeDisplayName | ★★ |
| 252 | "お問い合わせ" | buttons.contact | ★★★ |
| 255 | "ご質問やご要望をお聞かせください" | contact.prompt | ★★ |
| 273 | "ログアウト" | buttons.logout | ★★★ |
| 276 | "アカウントから安全に退出" | auth.safeLogout | ★★ |
| 296 | "新規登録" | buttons.signup | ★★★ |
| 304 | "ログイン" | buttons.login | ★★★ |

**推奨アクション**: 残りのテキストも common.json または header.json に追加

---

### 32. components/history-item-card.tsx

**日本語テキスト数**: 5件

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 29 | "募集中" | status.recruiting | ★★★ |
| 31 | "進行中" | status.inProgress | ★★★ |
| 37 | "取引完了" | status.completed | ★★★ |
| 43 | "キャンセル" | status.canceled | ★★★ |
| 80 | "コメント: {item.commentCount}" | history.commentCount | ★★ |

---

### 33. components/login-prompt.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 34. components/notification-dropdown.tsx

**日本語テキスト数**: 0件（✅ 既に多言語対応済み）

**状態**: `useTranslations()` を使用して完全に多言語対応されています。

---

### 35. components/trade-detail-client.tsx

**日本語テキスト数**: 39件 ⚠️

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 56 | "キャンセル" | status.canceled | ★★★ |
| 56 | "取引完了" | status.completed | ★★★ |
| 60 | "キャンセル" | status.canceled | ★★★ |
| 60 | "取引完了" | status.completed | ★★★ |
| 61 | "この募集を{action}しますか？" | trades.confirmAction | ★★★ |
| 66 | "{action}しました" | trades.actionCompleted | ★★★ |
| 66 | "募集のステータスを{action}に変更しました。" | trades.statusChanged | ★★★ |
| 70 | "{action}に失敗しました" | trades.actionFailed | ★★★ |
| 71 | "エラーが発生しました。" | errors.unexpected | ★★★ |
| 77 | "エラー" | errors.title | ★★★ |
| 77 | "{action}中にエラーが発生しました。" | trades.actionError | ★★★ |
| 85 | "投稿者操作" | trades.ownerActions | ★★ |
| 93 | "処理中..." | common.processing | ★★★ |
| 93 | "キャンセル" | buttons.cancel | ★★★ |
| 100 | "処理中..." | common.processing | ★★★ |
| 100 | "トレード完了" | trades.complete | ★★★ |
| 124 | "コピーしました" | messages.success.copied | ★★★ |
| 124 | "ID: {post.originalPostId} をクリップボードにコピーしました。" | trades.idCopied | ★★★ |
| 134 | "ユーザー" | common.user | ★★ |
| 147 | "入力エラー" | errors.inputError | ★★★ |
| 147 | "コメントを入力してください。" | comments.pleaseEnter | ★★★ |
| 159 | "ゲスト" | comments.guest | ★★★ |
| 163 | "投稿完了" | comments.posted | ★★★ |
| 163 | "コメントを投稿しました" | comments.postedSuccess | ★★★ |
| 165 | "コメントの投稿に失敗しました" | comments.postError | ★★★ |
| 172 | "コメント投稿エラー" | comments.postErrorTitle | ★★★ |
| 173 | "コメントの投稿に失敗しました。もう一度お試しください。" | comments.postErrorRetry | ★★★ |
| 181 | "入力エラー" | errors.inputError | ★★★ |
| 181 | "コメントを入力してください。" | comments.pleaseEnter | ★★★ |
| 305 | "タイムラインに戻る" | navigation.backToTimeline | ★★★ |
| 336 | "共有" | buttons.share | ★★★ |
| 341 | "募集中" | status.recruiting | ★★★ |
| 343 | "進行中" | status.inProgress | ★★★ |
| 345 | "完了" | status.completed | ★★★ |
| 355 | "求めるカード" | trades.wantedCards | ★★★ |
| 356 | "譲りたいカード" | trades.offeredCards | ★★★ |
| 360 | "投稿者からのコメント" | trades.authorComment | ★★ |
| 368 | "コピー" | buttons.copy | ★★★ |
| 375 | "コメント" | comments.title | ★★★ |
| 405 | "まだコメントはありません。" | comments.noComments | ★★★ |
| 411 | "コメントを入力してください..." | comments.placeholder | ★★★ |
| 418 | "Ctrl+Enter で送信" | comments.shortcutHint | ★★ |
| 426 | "投稿" | buttons.post | ★★★ |

**推奨アクション**: trades.json と comments.json に分割して管理

---

### 36. components/trade-post-card.tsx

**日本語テキスト数**: 14件 ⚠️

| 行番号 | テキスト | 推奨翻訳キー | 優先度 |
|-------|---------|------------|-------|
| 49 | "コピーしました" | messages.success.copied | ★★★ |
| 50 | "ID: {post.postId} をクリップボードにコピーしました。" | trades.idCopied | ★★★ |
| 97 | "募集中" | status.recruiting | ★★★ |
| 100 | "進行中" | status.inProgress | ★★★ |
| 102 | "完了" | status.completed | ★★★ |
| 125 | "ユーザー" | common.user | ★★ |
| 134 | "ユーザー" | common.user | ★★ |
| 145 | "求めるカード" | trades.wantedCards | ★★★ |
| 167 | "要相談" | common.negotiable | ★★ |
| 172 | "要相談" | common.negotiable | ★★ |
| 180 | "譲れるカード" | trades.offeredCards | ★★★ |
| 202 | "要相談" | common.negotiable | ★★ |
| 207 | "要相談" | common.negotiable | ★★ |
| 216 | "投稿者コメント：{post.authorComment}" | trades.authorComment | ★★ |
| 243 | "共有" | buttons.share | ★★★ |
| 252 | "詳細" | buttons.details | ★★★ |

---

## 推奨される翻訳ファイル構造

### 新規作成が必要なファイル

#### 1. `locales/ja/comments.json`
```json
{
  "title": "コメント",
  "titleWithCount": "コメント ({count})",
  "anonymousUser": "匿名ユーザー",
  "guest": "ゲスト",
  "justNow": "たった今",
  "noComments": "まだコメントはありません。",
  "placeholder": "コメントを入力してください...",
  "placeholderGuest": "ゲストとしてコメントを入力してください...",
  "pleaseEnter": "コメントを入力してください。",
  "posted": "投稿完了",
  "postedSuccess": "コメントを投稿しました",
  "postedAsGuest": "ゲストとしてコメントを投稿しました",
  "postError": "コメントの投稿に失敗しました",
  "postErrorTitle": "コメント投稿エラー",
  "postErrorRetry": "コメントの投稿に失敗しました。もう一度お試しください。",
  "loadError": "コメントの読み込みに失敗しました。",
  "loggedInAs": "ログイン中: {name}",
  "edited": "編集済み",
  "shortcutHint": "Ctrl+Enter で送信"
}
```

#### 2. `locales/ja/decks.json`
```json
{
  "untitled": "無題のデッキ",
  "noCards": "デッキにカードがありません。",
  "noRecipe": "デッキレシピ情報がありません",
  "updated": "更新: {date}",
  "type": "タイプ",
  "commentCount": "コメント数",
  "cardListLabel": "デッキのカード一覧 横スクロール",
  "categories": {
    "tier": "Tier",
    "featured": "注目",
    "newPack": "新パック",
    "post": "投稿"
  }
}
```

#### 3. `locales/ja/trades.json`
```json
{
  "wantedCards": "求めるカード",
  "offeredCards": "譲りたいカード",
  "offeredCardsAlt": "譲れるカード",
  "noCards": "カードなし",
  "ogTitle": "ポケモンカードトレード募集",
  "confirmAction": "この募集を{action}しますか？",
  "actionCompleted": "{action}しました",
  "statusChanged": "募集のステータスを{action}に変更しました。",
  "actionFailed": "{action}に失敗しました",
  "actionError": "{action}中にエラーが発生しました。",
  "ownerActions": "投稿者操作",
  "complete": "トレード完了",
  "authorComment": "投稿者からのコメント",
  "authorCommentWithText": "投稿者コメント：{comment}",
  "idCopied": "ID: {id} をクリップボードにコピーしました。"
}
```

#### 4. `locales/ja/survey.json`
```json
{
  "title": "ご意見をお聞かせください",
  "subtitle": "マッチング機能をより良くするため、1分アンケートにご協力ください。",
  "incompleteError": "未回答の項目があります。",
  "submitError": "送信中にエラーが発生しました。時間をおいて再度お試しください。",
  "thankYou": "ご回答ありがとうございました！",
  "thankYouMessage": "いただいたご意見を参考に、より良いマッチング体験をお届けします。公開まで少々お待ちください。",
  "q1": {
    "title": "Q1. マッチング相手を探すときに最も重視するものは？"
  },
  "q2": {
    "title": "Q2. マッチングで期待する体験は？（複数選択可）"
  },
  "q3": {
    "title": "Q3. マッチング後に欲しいサポート機能は？（複数選択可）"
  },
  "q4": {
    "title": "Q4. この機能をどのくらい使いたいですか？（任意）"
  }
}
```

#### 5. `locales/ja/evaluation.json`
```json
{
  "checkError": "ユーザー評価の確認に失敗しました",
  "checkErrorDetail": "ユーザー評価の確認中にエラーが発生しました。",
  "loginPrompt": "デッキを評価するにはログインしてください。",
  "alreadyRated": "既に評価済みです",
  "alreadyRatedDetail": "このデッキは既に評価されています。",
  "submitError": "評価の送信に失敗しました",
  "submitErrorDetail": "評価の送信中にエラーが発生しました。",
  "submitSuccess": "評価を送信しました",
  "submitSuccessDetail": "あなたの評価 {score} 点が反映されました。",
  "deckFeatures": "デッキ特徴",
  "stats": {
    "accessibility": "集めやすさ",
    "speed": "速度",
    "power": "火力",
    "durability": "耐久",
    "stability": "安定"
  }
}
```

#### 6. `locales/ja/status.json`
```json
{
  "recruiting": "募集中",
  "inProgress": "進行中",
  "completed": "取引完了",
  "completedShort": "完了",
  "canceled": "キャンセル"
}
```

#### 7. `locales/ja/cards.json` (既存ファイルに追加)
```json
{
  "card": "カード",
  "unknown": "不明なカード",
  "count": "{count}枚",
  "types": {
    "pokemon": "ポケモン",
    "trainers": "トレーナーズ",
    "energy": "エネルギー"
  }
}
```

#### 8. `locales/ja/errors.json` (既存ファイルに追加)
```json
{
  "title": "エラー",
  "inputError": "入力エラー",
  "unexpected": "予期しないエラーが発生しました。",
  "operationFailed": "操作に失敗しました",
  "loginRequired": "ログインが必要です"
}
```

#### 9. `locales/ja/actions.json`
```json
{
  "like": "いいね",
  "favorite": "お気に入り"
}
```

---

## 実装優先順位

### 最優先 (Phase 1) - ★★★
1. **コメント機能** (DeckComments, TradeComments, trade-detail-client)
2. **トレード機能** (trade-detail-client, trade-post-card, opengraph-image)
3. **エラーメッセージ** (全コンポーネントで共通使用)
4. **基本的なボタン・アクション** (いいね、お気に入り、投稿など)

### 高優先度 (Phase 2) - ★★
5. **デッキ機能** (deck-card, deck-horizontal-row, deck-evaluation)
6. **ステータス表示** (history-item-card, trade-post-card)
7. **マッチングサーベイ** (MatchingSurvey, MatchingThanks)
8. **ヘッダーの残り部分** (header.tsx)

### 中優先度 (Phase 3) - ★
9. **カード関連** (deck-cards-grid, deck-composition-chart)
10. **その他UI要素** (history-item-card, OGP画像など)

---

## 実装手順の推奨

### Step 1: 翻訳ファイルの作成
1. 上記の新規JSONファイルをすべて作成
2. 既存の `errors.json`, `cards.json` に不足しているキーを追加
3. `common.json` に actions.json の内容を統合（または別ファイルとして作成）

### Step 2: コンポーネントの修正
1. 各コンポーネントに `useTranslations()` フックを追加
2. ハードコードされた日本語を `t()` 関数呼び出しに置換
3. 動的な値（カウント、日付など）はプレースホルダーを使用

### Step 3: テスト
1. 日本語環境での表示確認
2. 英語環境での表示確認（英訳が必要）
3. 動的な値が正しく表示されるか確認

---

## 注意事項

1. **日付のローカライゼーション**: `toLocaleDateString("ja-JP")` はハードコードされているため、ロケールに応じて動的に変更する必要があります。

2. **プレースホルダーの使用**:
   - カウント: `{count}`
   - 名前: `{name}`
   - 日付: `{date}`
   などを使用して、動的な値を挿入できるようにする

3. **複数形の処理**: 英語では単数形/複数形の区別が必要なため、`next-intl` の複数形機能を活用

4. **文脈依存の翻訳**: 同じ日本語でも文脈によって英語訳が異なる場合があるため、キー名を明確に

---

## まとめ

- **既に多言語対応済み**: 20ファイル（app/[locale]以下のページと一部コンポーネント）
- **要対応**: 16ファイル（主にcomponents配下）
- **推定作業時間**:
  - Phase 1: 4-6時間
  - Phase 2: 3-4時間
  - Phase 3: 2-3時間
  - 合計: 9-13時間
