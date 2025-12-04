# 多言語化：ハードコードされた日本語テキストの移行計画

## 📊 概要

- **調査日**: 2025-11-29
- **対象ファイル数**: 36ファイル
- **対象**: `components/`と`app/[locale]/`配下のTSXファイル
- **目的**: ハードコードされた日本語テキストを翻訳辞書（`locales/*/`）を使用するように置き換え

## 🎯 移行戦略

### Phase 1: 優先度高（ユーザーインターフェース）
これらはすべてのページで表示される重要なコンポーネント

| ファイル | 優先度 | 影響範囲 | 説明 |
|---------|-------|---------|------|
| `components/header.tsx` | ★★★ | 全ページ | ナビゲーションヘッダー |
| `components/layout/header.tsx` | ★★★ | 全ページ | Layoutヘッダー |
| `components/footer.tsx` | ★★★ | 全ページ | フッター |
| `components/login-prompt.tsx` | ★★★ | 未ログイン時 | ログインプロンプト |
| `components/notification-dropdown.tsx` | ★★ | ログイン時 | 通知ドロップダウン |

### Phase 2: 優先度中（主要ページ）
頻繁にアクセスされるページ

| ファイル | 優先度 | 説明 |
|---------|-------|------|
| `app/[locale]/page.tsx` | ★★★ | トップページ |
| `app/[locale]/matching/page.tsx` | ★★★ | マッチングページ |
| `app/[locale]/decks/page.tsx` | ★★ | デッキ一覧 |
| `app/[locale]/history/page.tsx` | ★★ | 履歴ページ |
| `app/[locale]/info/page.tsx` | ★★ | 最新情報 |

### Phase 3: 優先度中（詳細ページ）
個別コンテンツページ

| ファイル | 優先度 | 説明 |
|---------|-------|------|
| `app/[locale]/trades/[id]/page.tsx` | ★★ | トレード詳細 |
| `app/[locale]/decks/[id]/page.tsx` | ★★ | デッキ詳細 |
| `app/[locale]/collages/[id]/collage-page-client.tsx` | ★ | コラージュ詳細 |

### Phase 4: 優先度低（作成・編集ページ）
特定の機能ページ

| ファイル | 優先度 | 説明 |
|---------|-------|------|
| `app/[locale]/trades/create/page.tsx` | ★ | トレード作成 |
| `app/[locale]/decks/create/page.tsx` | ★ | デッキ作成 |
| `app/[locale]/lists/create/page.tsx` | ★ | リスト作成 |

### Phase 5: コンポーネント
再利用可能なコンポーネント

| ファイル | 優先度 | 説明 |
|---------|-------|------|
| `components/trade-post-card.tsx` | ★★ | トレード投稿カード |
| `components/deck-card.tsx` | ★★ | デッキカード |
| `components/DeckComments.tsx` | ★ | デッキコメント |
| `components/TradeComments.tsx` | ★ | トレードコメント |
| `components/MatchingSurvey.tsx` | ★ | マッチングアンケート |

## 🔧 実装パターン

### パターン1: Client Componentでの使用

```typescript
// Before
export default function Header() {
  return <Button>ログイン</Button>
}

// After
"use client"
import { useTranslations } from 'next-intl'

export default function Header() {
  const t = useTranslations()
  return <Button>{t('buttons.login')}</Button>
}
```

### パターン2: Server Componentでの使用

```typescript
// Before
export default async function Page() {
  return <h1>ホーム</h1>
}

// After
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations()
  return <h1>{t('navigation.home')}</h1>
}
```

## 📝 対象ファイル一覧（全36ファイル）

### App Router Pages (20ファイル)
1. `app/[locale]/auth/login/page.tsx`
2. `app/[locale]/collages/[id]/collage-page-client.tsx`
3. `app/[locale]/collages/page.tsx`
4. `app/[locale]/contact/page.tsx`
5. `app/[locale]/content/[id]/page.tsx`
6. `app/[locale]/decks/[id]/page.tsx`
7. `app/[locale]/decks/create/page.tsx`
8. `app/[locale]/decks/page.tsx`
9. `app/[locale]/favorites/page.tsx`
10. `app/[locale]/history/page.tsx`
11. `app/[locale]/info/news/page.tsx`
12. `app/[locale]/info/page.tsx`
13. `app/[locale]/layout.tsx`
14. `app/[locale]/lists/create/page.tsx`
15. `app/[locale]/lists/page.tsx`
16. `app/[locale]/matching/page.tsx`
17. `app/[locale]/page.tsx`
18. `app/[locale]/trades/[id]/opengraph-image.tsx`
19. `app/[locale]/trades/[id]/page.tsx`
20. `app/[locale]/trades/create/page.tsx`

### Components (16ファイル)
21. `components/DeckComments.tsx`
22. `components/MatchingSurvey.tsx`
23. `components/MatchingThanks.tsx`
24. `components/TradeComments.tsx`
25. `components/deck-card.tsx`
26. `components/deck-cards-grid.tsx`
27. `components/deck-composition-chart.tsx`
28. `components/deck-evaluation.tsx`
29. `components/deck-horizontal-row.tsx`
30. `components/footer.tsx`
31. `components/header.tsx`
32. `components/history-item-card.tsx`
33. `components/login-prompt.tsx`
34. `components/notification-dropdown.tsx`
35. `components/trade-detail-client.tsx`
36. `components/trade-post-card.tsx`

## 🗂️ 翻訳キー構造

既存の翻訳ファイル構造を活用:

```
locales/
├── ja/
│   ├── common.json      # navigation, buttons など共通UI
│   ├── auth.json        # ログイン、認証関連
│   ├── cards.json       # カード関連
│   ├── errors.json      # エラーメッセージ
│   ├── forms.json       # フォームラベル
│   ├── messages.json    # 通知メッセージ
│   └── pages.json       # ページ固有のテキスト
└── en/
    └── (同じ構造)
```

## ⚠️ 注意事項

1. **"use client"ディレクティブの追加**: Client Componentで`useTranslations()`を使用する場合は必須
2. **Server Componentとの区別**: Server Componentでは`getTranslations()`を使用
3. **動的テキスト**: 変数を含むテキストは翻訳キーにプレースホルダーを使用
4. **既存のJSONファイルとの整合性**: 既存の翻訳キーを優先的に使用

## 📈 進捗トラッキング

- [ ] Phase 1: 優先度高（5ファイル）
- [ ] Phase 2: 優先度中（5ファイル）
- [ ] Phase 3: 詳細ページ（3ファイル）
- [ ] Phase 4: 作成・編集ページ（3ファイル）
- [ ] Phase 5: コンポーネント（20ファイル）
- [ ] 最終確認とテスト
- [ ] ビルド確認
- [ ] デプロイ

## 🎯 次のステップ

1. Phase 1の優先度高ファイルから着手
2. 各ファイルを修正後、ローカルでテスト（`/ja`と`/en`で確認）
3. 段階的にコミット
4. 全Phase完了後、最終ビルド確認
