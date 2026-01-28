# Phase 3: API実装ガイド

**作成日**: 2025-11-25
**対象**: 多言語対応API実装

---

## 📋 完了した実装

### 1. JSONB抽出ヘルパー関数（`lib/i18n-helpers.ts`）

多言語JSONBフィールドから言語を抽出するヘルパー関数群を実装しました。

#### 主要な関数

**`getLocalizedText()`**
```typescript
// JSONBから指定言語のテキストを抽出（フォールバック付き）
const name = getLocalizedText(card.name_multilingual, 'en');
// "Pikachu ex"
```

**`getLocalizedArray()`**
```typescript
// JSONB配列から指定言語の配列を抽出
const cards = getLocalizedArray(page.deck_cards_multilingual, 'en');
// [{ card_id: 1, pack_name: "Genetic Apex" }]
```

**`localizeObject()`**
```typescript
// オブジェクト全体を多言語化
const localizedCard = localizeObject(card, 'en', ['name', 'image_url']);
```

**特化関数**
- `localizeCard()` - カードオブジェクトを多言語化
- `localizeDeckPage()` - デッキページを多言語化
- `localizeInfoPage()` - 記事ページを多言語化
- `localizeDeck()` - ユーザーデッキを多言語化
- `localizeTradePost()` - トレード投稿を多言語化

**言語検出関数**
- `parseAcceptLanguage()` - Accept-Languageヘッダーから言語を抽出
- `normalizeLocale()` - 言語コードを正規化
- `isSupportedLanguage()` - 対応言語かチェック

#### フォールバック機能

言語が見つからない場合、以下の順序でフォールバック：
1. 指定された言語
2. 日本語（ja）
3. 英語（en）
4. デフォルト値（空文字列）

---

### 2. カード取得API

#### `GET /api/cards`
カード一覧を取得（多言語対応）

**Query Parameters**:
- `locale`: 言語コード（例: en, ja, ko）
- `pack_id`: パックIDでフィルタ（オプション）
- `limit`: 取得件数（デフォルト: 100、最大: 500）
- `offset`: オフセット（ページネーション用）

**Headers**:
- `Accept-Language`: 優先言語（localeパラメータがない場合に使用）

**使用例**:
```bash
# 英語でカード一覧を取得
curl "http://localhost:3000/api/cards?locale=en&limit=10"

# Accept-Languageヘッダーで言語指定
curl -H "Accept-Language: ko" "http://localhost:3000/api/cards"
```

**レスポンス例**:
```json
{
  "cards": [
    {
      "id": 3101,
      "name": "Lapras ex",
      "image_url": "https://assets.tcgdex.net/en/tcgp/P-A/014/low.webp",
      "type_code": "water",
      "rarity_code": "rare"
    }
  ],
  "locale": "en",
  "count": 10,
  "hasMore": true
}
```

#### `GET /api/cards/[id]`
個別カードを取得（多言語対応）

**使用例**:
```bash
# 英語で特定のカードを取得
curl "http://localhost:3000/api/cards/3101?locale=en"
```

**レスポンス例**:
```json
{
  "card": {
    "id": 3101,
    "name": "Lapras ex",
    "image_url": "https://assets.tcgdex.net/en/tcgp/P-A/014/low.webp",
    "col_3": "PROMO-A",
    "col_4": "014/P-A",
    "col_5": "P-A-014",
    "hp": 150,
    "type_code": "water"
  },
  "locale": "en"
}
```

---

### 3. 記事取得API

#### `GET /api/info/[id]`
記事ページを取得（多言語対応）

**Query Parameters**:
- `locale`: 言語コード

**使用例**:
```bash
# フランス語で記事を取得
curl "http://localhost:3000/api/info/1?locale=fr"
```

**レスポンス例**:
```json
{
  "page": {
    "id": 1,
    "title": "Guide du Deck Mewtwo ex",
    "deck_name": "Mewtwo ex Deck",
    "deck_description": "Un deck puissant centré sur Mewtwo ex...",
    "deck_cards": [
      {
        "card_id": 3113,
        "pack_name": "Genetic Apex",
        "card_count": 2
      }
    ]
  },
  "locale": "fr"
}
```

---

### 4. デッキガイドページ取得API

#### `GET /api/deck-pages/[id]`
デッキガイドページを取得（多言語対応）

**使用例**:
```bash
# 韓国語でデッキガイドを取得
curl "http://localhost:3000/api/deck-pages/1?locale=ko"
```

**レスポンス例**:
```json
{
  "page": {
    "id": 1,
    "title": "뮤츠 ex 덱 가이드",
    "deck_name": "뮤츠 ex 덱",
    "tier_name": "Tier 1",
    "evaluation_title": "덱 평가",
    "how_to_play_steps": [
      "1단계: 뮤츠를 활성화...",
      "2단계: 에너지 부착..."
    ]
  },
  "locale": "ko"
}
```

---

### 5. ユーザーデッキ取得API

#### `GET /api/decks/[id]`
ユーザー作成デッキを取得（多言語対応）

**機能**:
- 非公開デッキは所有者のみアクセス可能
- 翻訳ステータス（pending, processing, completed, failed）を返す

**使用例**:
```bash
# 中国語（繁体字）でデッキを取得
curl "http://localhost:3000/api/decks/123?locale=zh-TW"
```

**レスポンス例**:
```json
{
  "deck": {
    "id": 123,
    "title": "皮卡丘 ex 快攻",
    "description": "使用皮卡丘 ex 的快速進攻策略...",
    "translation_status": "completed",
    "favorite_count": 42
  },
  "locale": "zh-TW"
}
```

---

### 6. トレード投稿取得API

#### `GET /api/trades`
トレード投稿一覧を取得（多言語対応）

**Query Parameters**:
- `locale`: 言語コード
- `status`: ステータスフィルタ（open, closed, cancelled）
- `limit`: 取得件数（デフォルト: 20、最大: 100）
- `offset`: オフセット（ページネーション用）

**使用例**:
```bash
# ドイツ語で公開中のトレードを取得
curl "http://localhost:3000/api/trades?locale=de&status=open&limit=10"
```

**レスポンス例**:
```json
{
  "posts": [
    {
      "id": 456,
      "title": "Tausche Glurak ex",
      "comment": "Suche Pikachu ex",
      "status": "open",
      "translation_status": "completed"
    }
  ],
  "locale": "de",
  "count": 10,
  "hasMore": true
}
```

#### `GET /api/trades/[id]`
個別トレード投稿を取得（多言語対応）

**使用例**:
```bash
# スペイン語で特定のトレードを取得
curl "http://localhost:3000/api/trades/456?locale=es"
```

---

## 🔧 技術仕様

### 言語検出の優先順位

1. **クエリパラメータ `locale`**
   ```
   GET /api/cards?locale=en
   ```

2. **Accept-Languageヘッダー**
   ```
   Accept-Language: ko-KR,ko;q=0.9,en;q=0.8
   ```

3. **デフォルト言語**
   ```
   ja（日本語）
   ```

### 対応言語

```typescript
const SUPPORTED_LANGUAGES = [
  'ja',      // 日本語
  'en',      // 英語
  'ko',      // 韓国語
  'zh-TW',   // 中国語繁体字
  'fr',      // フランス語
  'es',      // スペイン語
  'de',      // ドイツ語
  'it',      // イタリア語（未実装）
  'pt-br',   // ポルトガル語（未実装）
];
```

### エラーハンドリング

すべてのAPIで統一されたエラーレスポンスを返します：

**400 Bad Request**:
```json
{
  "error": "Invalid card ID"
}
```

**404 Not Found**:
```json
{
  "error": "Card not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error"
}
```

### フォールバック実装

1. **言語フォールバック**
   - 指定言語が存在しない場合、日本語（ja）を返す
   - 日本語も存在しない場合、英語（en）を返す
   - すべて存在しない場合、デフォルト値（空文字列）を返す

2. **データフォールバック**
   - 多言語カラムが存在しない場合、元のカラム値を使用
   - 例: `name_multilingual` が null の場合、`name` を使用

---

## 📁 ファイル構成

```
lib/
└── i18n-helpers.ts           # JSONB抽出ヘルパー関数

app/api/
├── cards/
│   ├── route.ts              # カード一覧API
│   └── [id]/route.ts         # 個別カードAPI
├── info/
│   └── [id]/route.ts         # 記事ページAPI
├── deck-pages/
│   └── [id]/route.ts         # デッキガイドページAPI
├── decks/
│   └── [id]/route.ts         # ユーザーデッキAPI
└── trades/
    ├── route.ts              # トレード投稿一覧API
    └── [id]/route.ts         # 個別トレード投稿API
```

---

## 🧪 テスト方法

### 1. ローカルサーバー起動

```bash
pnpm dev
```

### 2. APIテスト

**カード一覧（英語）**:
```bash
curl "http://localhost:3000/api/cards?locale=en&limit=5"
```

**個別カード（韓国語）**:
```bash
curl "http://localhost:3000/api/cards/3101?locale=ko"
```

**Accept-Languageヘッダー使用**:
```bash
curl -H "Accept-Language: fr-FR,fr;q=0.9" "http://localhost:3000/api/cards/3101"
```

### 3. フォールバックテスト

**未実装言語（イタリア語）でリクエスト**:
```bash
curl "http://localhost:3000/api/cards/3101?locale=it"
# → 日本語にフォールバック
```

**存在しない言語コード**:
```bash
curl "http://localhost:3000/api/cards/3101?locale=xx"
# → デフォルト言語（日本語）にフォールバック
```

---

## 🎯 使用例（フロントエンド）

### Next.jsコンポーネントでの使用

```typescript
// components/card-display.tsx
'use client';

import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

export default function CardDisplay({ cardId }: { cardId: number }) {
  const locale = useLocale();
  const [card, setCard] = useState(null);

  useEffect(() => {
    fetch(`/api/cards/${cardId}?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => setCard(data.card));
  }, [cardId, locale]);

  if (!card) return <div>Loading...</div>;

  return (
    <div>
      <h3>{card.name}</h3>
      <img src={card.image_url} alt={card.name} />
      <p>HP: {card.hp}</p>
    </div>
  );
}
```

### Server Componentでの使用

```typescript
// app/cards/[id]/page.tsx
import { headers } from 'next/headers';

export default async function CardPage({
  params,
}: {
  params: { id: string };
}) {
  const headersList = headers();
  const locale = headersList.get('x-locale') || 'ja';

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/cards/${params.id}?locale=${locale}`,
    { next: { revalidate: 3600 } }
  );

  const { card } = await response.json();

  return (
    <div>
      <h1>{card.name}</h1>
      <img src={card.image_url} alt={card.name} />
    </div>
  );
}
```

---

## 📝 実装メモ

### Phase 3 完了内容

✅ **完了**:
1. `lib/i18n-helpers.ts` - JSONB抽出ヘルパー関数（15関数）
2. カード取得API（一覧・個別）
3. 記事ページ取得API
4. デッキガイドページ取得API
5. ユーザーデッキ取得API
6. トレード投稿取得API（一覧・個別）
7. 言語検出・正規化機能
8. フォールバック機能
9. エラーハンドリング
10. 統一されたレスポンス形式

### 次のステップ（Phase 4）

- Google Cloud Translate API統合
- パックデータ翻訳スクリプト
- システムコンテンツ翻訳スクリプト
- バックグラウンド翻訳ワーカー実装

---

**作成者**: Claude Code
**最終更新**: 2025-11-25
