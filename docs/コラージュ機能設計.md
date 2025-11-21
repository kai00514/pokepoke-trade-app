# コラージュ画像生成機能 - 設計ドキュメント

## 目次
1. [機能概要](#機能概要)
2. [全体アーキテクチャ](#全体アーキテクチャ)
3. [データベース設計](#データベース設計)
4. [画像生成ロジック](#画像生成ロジック)
5. [API仕様](#api仕様)
6. [UIフロー](#uiフロー)
7. [ファイル構成](#ファイル構成)
8. [既知の問題と修正計画](#既知の問題と修正計画)

---

## 機能概要

### 目的
ポケモンカードのコラージュ画像を生成し、Xでシェアできる機能を提供する。

### 主要機能
- 2つのカードグループ（求めるカード/譲れるカード）を選択
- カスタムタイトルを設定
- 1536×1024pxのコラージュ画像を生成
- Supabase Storageに保存
- X投稿用OG画像（1200×630px）を動的生成
- 画像ダウンロード機能

---

## 全体アーキテクチャ

### データフロー

\`\`\`
┌─────────────────────────────────────────┐
│ 1. ユーザーがカード選択                    │
│    - タイトル1 + カード1（1～30枚）        │
│    - タイトル2 + カード2（1～30枚）        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 2. POST /api/collages/generate          │
│    - カードIDをデータベースに保存          │
│    - generateCollageImageBuffer()実行     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 3. 画像生成（Sharp）                      │
│    - 背景画像読み込み                     │
│    - カード画像をfetch                    │
│    - レイアウト計算                       │
│    - 合成して1536×1024px生成             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 4. Supabase Storageにアップロード        │
│    - バケット: collages                  │
│    - ファイル名: {collageId}.png         │
│    - 公開URLを取得                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 5. データベース更新                       │
│    - collage_image_url に保存            │
│    - collage_storage_path に保存         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 6. プレビュー画面表示                     │
│    - Storageから画像を表示               │
│    - Xシェアボタン                       │
│    - ダウンロードボタン                   │
└─────────────────────────────────────────┘
\`\`\`

---

## データベース設計

### テーブル: user_collages

\`\`\`sql
CREATE TABLE user_collages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- グループ1
  title1 TEXT NOT NULL DEFAULT '求めるカード',
  card_ids_1 BIGINT[] NOT NULL,
  
  -- グループ2
  title2 TEXT NOT NULL DEFAULT '譲れるカード',
  card_ids_2 BIGINT[] NOT NULL,
  
  -- 画像情報
  collage_image_url TEXT,              -- Supabase Storage公開URL
  collage_storage_path TEXT,           -- Storage内パス（削除用）
  
  -- メタデータ
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_user_id_created ON user_collages (user_id, created_at DESC);
CREATE INDEX idx_user_id ON user_collages (user_id);
\`\`\`

### カラム説明

| カラム名 | 型 | 必須 | 説明 |
|---------|-----|------|------|
| id | UUID | ○ | コラージュの一意識別子 |
| user_id | UUID | ○ | 作成ユーザー |
| title1 | TEXT | ○ | グループ1のタイトル |
| card_ids_1 | BIGINT[] | ○ | グループ1のカードID配列 |
| title2 | TEXT | ○ | グループ2のタイトル |
| card_ids_2 | BIGINT[] | ○ | グループ2のカードID配列 |
| collage_image_url | TEXT | - | 生成画像の公開URL |
| collage_storage_path | TEXT | - | Storageパス |
| created_at | TIMESTAMP | ○ | 作成日時 |
| updated_at | TIMESTAMP | ○ | 更新日時 |

---

## 画像生成ロジック

### レイアウト仕様

#### 背景画像
- サイズ: 1536 × 1024px
- ファイル: `public/coragu_backimage.png`
- デザイン: ポケボールネオン風（マゼンタ→青グラデーション）

#### ゾーン構成

\`\`\`
背景: 1536 × 1024px

┌─────────────────────────────────┐
│ Zone 1: タイトル1                │ 高さ: 80px
│ Y座標: 0                        │
└─────────────────────────────────┘
     ↓ スペース（均一）
┌─────────────────────────────────┐
│ Zone 2: カード一覧1グリッド       │ 高さ: 動的
│ Y座標: 80 + spacing             │
│ 配置幅: 1416px (左右60pxパディング) │
└─────────────────────────────────┘
     ↓ スペース（均一）
┌─────────────────────────────────┐
│ Zone 3: タイトル2                │ 高さ: 80px
│ Y座標: 動的                     │
└─────────────────────────────────┘
     ↓ スペース（均一）
┌─────────────────────────────────┐
│ Zone 4: カード一覧2グリッド       │ 高さ: 動的
│ Y座標: 動的                     │
│ 配置幅: 1416px                  │
└─────────────────────────────────┘
     ↓ スペース（均一）
\`\`\`

#### 均一スペース計算

\`\`\`typescript
uniform_spacing = (1024 - 80 - cards1Height - 80 - cards2Height) / 4
\`\`\`

全4つのスペース（Zone1↓, Zone2↓, Zone3↓, Zone4↓）が常に同じ高さになる。

#### グリッドパターン

| 枚数 | グリッド | カード1枚サイズ |
|------|---------|---------------|
| 1-2 | 1×1/1×2 | 220×220px |
| 3-4 | 2×2 | 180×180px |
| 5-6 | 2×3 | 160×160px |
| 7-9 | 3×3 | 140×140px |
| 10-12 | 3×4 | 120×120px |
| 13-16 | 4×4 | 110×110px |
| 17-20 | 4×5 | 100×100px |
| 21-25 | 5×5 | 95×95px |
| 26-30 | 5×6 | 85×85px |

グリッド間隔: 12px

### X投稿用OG画像

- サイズ: 1200 × 630px
- 生成方法: 1536×1024から動的スケーリング
- エンドポイント: `/collages/[id]/opengraph-image`

---

## API仕様

### 1. コラージュ一覧取得

\`\`\`
GET /api/collages?limit=50&offset=0

Query Parameters:
- limit: number (デフォルト: 50)
- offset: number (デフォルト: 0)

Response:
{
  "success": true,
  "data": {
    "collages": [
      {
        "id": "uuid",
        "title1": "求めるカード",
        "title2": "譲れるカード",
        "cardCount1": 10,
        "cardCount2": 8,
        "collage_image_url": "https://...",
        "created_at": "2025-01-15T10:00:00Z"
      }
    ],
    "total": 45
  }
}
\`\`\`

### 2. コラージュ生成

\`\`\`
POST /api/collages/generate

Request Body:
{
  "title1": "求めるカード",
  "card_ids_1": [1, 2, 3, ...],
  "title2": "譲れるカード",
  "card_ids_2": [10, 11, 12, ...]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "collage_url": "/collages/uuid",
    "image_url": "https://storage.supabase.co/..."
  }
}
\`\`\`

### 3. コラージュ詳細取得

\`\`\`
GET /api/collages/[id]

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title1": "求めるカード",
    "title2": "譲れるカード",
    "cards1": [...],
    "cards2": [...],
    "collage_image_url": "https://...",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
\`\`\`

### 4. コラージュ削除

\`\`\`
DELETE /api/collages/[id]

Response:
{
  "success": true
}
\`\`\`

### 5. OG画像生成

\`\`\`
GET /collages/[id]/opengraph-image

Response: PNG画像 (1200×630px)
\`\`\`

### 6. 画像ダウンロード

\`\`\`
GET /api/collages/[id]/download

Response: PNG画像 (1536×1024px)
Content-Disposition: attachment
\`\`\`

---

## UIフロー

### 1. コラージュ一覧ページ (`/collages`)

\`\`\`
┌────────────────────────────────┐
│ コラージュ一覧                  │
├────────────────────────────────┤
│ [新規生成ボタン]                │
├────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐         │
│ │画像│ │画像│ │画像│ ...     │
│ │詳細│ │詳細│ │詳細│         │
│ └────┘ └────┘ └────┘         │
└────────────────────────────────┘
\`\`\`

### 2. 生成モーダル

\`\`\`
Step 1: タイトル1入力
  ↓
Step 2: カード選択1（最大30枚）
  ↓
Step 3: タイトル2入力
  ↓
Step 4: カード選択2（最大30枚）
  ↓
Step 5: プレビュー表示
\`\`\`

### 3. 詳細ページ (`/collages/[id]`)

\`\`\`
┌────────────────────────────────┐
│ コラージュ画像                  │
│ [1536×1024px 表示]             │
├────────────────────────────────┤
│ [ダウンロード] [Xに共有] [削除] │
├────────────────────────────────┤
│ カード情報:                     │
│ - グループ1: 10枚               │
│ - グループ2: 8枚                │
│ - 作成日時: 2025/01/15         │
└────────────────────────────────┘
\`\`\`

---

## ファイル構成

### コアロジック

\`\`\`
lib/
├── collage-generator.ts          # レイアウト計算
├── collage-image-generator.tsx   # 画像生成（Sharp）
└── actions/
    ├── collages.ts               # DB操作
    └── upload-collage-image.ts   # Storage操作
\`\`\`

### APIエンドポイント

\`\`\`
app/api/collages/
├── route.ts                      # GET一覧, POST生成
├── [id]/
│   ├── route.ts                  # GET詳細, DELETE削除
│   └── download/
│       └── route.tsx             # GETダウンロード
└── generate/
    └── route.ts                  # POST生成（重複）
\`\`\`

### UIコンポーネント

\`\`\`
app/collages/
├── page.tsx                      # 一覧ページ
└── [id]/
    ├── page.tsx                  # 詳細ページ
    ├── collage-page-client.tsx   # 詳細クライアント
    └── opengraph-image.tsx       # OG画像生成

components/collage/
├── collage-generator-button.tsx  # 生成ボタン
├── collage-generator-modal.tsx   # 生成モーダル
├── collage-list.tsx              # 一覧表示
└── collage-preview.tsx           # プレビュー
\`\`\`

### 型定義

\`\`\`
types/
└── collage.ts                    # 型定義
\`\`\`

---

## 既知の問題と修正計画

### 🔴 重大（動作不可）

1. **GET /api/collages が400エラー**
   - 原因: `userId`をフロントエンドが渡していない
   - 修正箇所: `components/collage/collage-list.tsx`
   - 優先度: 最高

2. **OG画像生成が500エラー**
   - 原因: カード画像変換失敗
   - 修正箇所: `app/collages/[id]/opengraph-image.tsx`
   - 優先度: 最高

3. **ファイル拡張子の不一致**
   - 原因: `lib/collage-image-generator.tsx` がJSX未使用
   - 修正: `.tsx` → `.ts` にリネーム
   - 優先度: 高

### 🟡 中優先（機能不完全）

4. **API重複**
   - `/api/collages` (POST) と `/api/collages/generate` (POST) が重複
   - 統合が必要

5. **Supabase Storageバケット未作成**
   - `collages` バケットを手動作成する必要がある
   - 公開バケットとして設定

6. **データベースカラム未追加**
   - `collage_image_url` と `collage_storage_path` カラム
   - SQLスクリプト実行が必要

### 🟢 低優先（最適化）

7. **OG画像のスケーリング歪み**
   - 1536×1024 → 1200×630 で異なる比率
   - アスペクト比保持の改善

8. **エラーハンドリング強化**
   - タイムアウト処理
   - リトライロジック

---

## セットアップ手順

### 1. Supabase Storage設定

\`\`\`bash
# Supabase管理画面で実行
1. Storage → New bucket
2. バケット名: collages
3. Public: ON
4. Create
\`\`\`

### 2. データベースマイグレーション

\`\`\`sql
-- collagesバケット作成後、カラム追加
ALTER TABLE user_collages 
ADD COLUMN IF NOT EXISTS collage_image_url TEXT,
ADD COLUMN IF NOT EXISTS collage_storage_path TEXT;
\`\`\`

### 3. 環境変数確認

\`\`\`env
NEXT_PUBLIC_SITE_URL=https://www.pokelnk.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
\`\`\`

### 4. 背景画像配置

\`\`\`bash
public/coragu_backimage.png (1536×1024px)
\`\`\`

---

## パフォーマンス仕様

### 画像生成時間
- 目標: 5秒以内
- 現状: 8-10秒（最適化必要）

### キャッシュ戦略
- Storage画像: 永続保存
- OG画像: CDNキャッシュ（7日）
- API: キャッシュなし（リアルタイム）

### ファイルサイズ
- コラージュ画像: 200-400KB
- OG画像: 100-200KB

---

## 今後の拡張計画

1. 複数背景テンプレート
2. カスタムフォント対応
3. カード枠・エフェクト追加
4. SNS共有の拡大（Instagram, Facebook）
5. コラージュテンプレート保存機能

---

最終更新: 2025-01-15
バージョン: 1.0.0
