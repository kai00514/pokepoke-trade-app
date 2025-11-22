# i18n テスト環境 - クイックスタートガイド

**ブランチ**: `feature/i18n-test-environment`
**作成日**: 2025-11-22

---

## 🎯 概要

このブランチは、9言語対応のi18n実装をテストするための専用環境です。本番環境に影響を与えずに、多言語対応の開発・テスト・デバッグが可能です。

### 対応言語
- 🇯🇵 日本語 (ja) - デフォルト
- 🇬🇧 英語 (en)
- 🇨🇳 中国語簡体字 (zh-cn)
- 🇹🇼 中国語繁体字 (zh-tw)
- 🇧🇷 ポルトガル語 (pt-br)
- 🇫🇷 フランス語 (fr)
- 🇮🇹 イタリア語 (it)
- 🇩🇪 ドイツ語 (de)
- 🇪🇸 スペイン語 (es)

---

## 📚 ドキュメント

### メインドキュメント
1. **[テスト環境構築手順.md](./docs/テスト環境構築手順.md)** ⭐ 必読
   - 詳細な手順書（10ステップ）
   - Supabase設定、Vercel設定、i18n実装
   - トラブルシューティング含む

2. **[テスト環境構築チェックリスト.md](./docs/テスト環境構築チェックリスト.md)**
   - 実作業用チェックリスト
   - 各タスクの所要時間付き
   - 12フェーズに分割

3. **[i18nファイル作成完了サマリー.md](./docs/i18nファイル作成完了サマリー.md)**
   - i18n実装の詳細
   - ファイル構造と使用方法
   - 統計情報

### 設計ドキュメント
- [多言語対応設計.md](./docs/多言語対応設計.md)
- [ユーザー言語検出オプション.md](./docs/ユーザー言語検出オプション.md)

---

## 🚀 クイックスタート

### 前提条件
- Node.js 18+ がインストール済み
- pnpm がインストール済み
- Supabaseアカウント
- Vercelアカウント
- GitHubアカウント

### 1. リポジトリのクローン

```bash
# リポジトリをクローン（既にある場合はスキップ）
git clone https://github.com/your-org/pokepoke-trade-app.git
cd pokepoke-trade-app

# ブランチをチェックアウト
git checkout feature/i18n-test-environment

# 依存関係をインストール
pnpm install
```

### 2. Supabaseテストプロジェクト作成

1. https://app.supabase.com にアクセス
2. 新規プロジェクト作成: `pokepoke-i18n-test`
3. 認証情報をメモ:
   - Project URL
   - Anon Key

### 3. 環境変数の設定

```bash
# .env.local を作成
cp .env.local.example .env.local

# 以下を設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_ENV=test
```

### 4. ローカルで起動

```bash
pnpm dev
```

ブラウザで http://localhost:3000 を開く

### 5. Vercelにデプロイ

```bash
# 変更をコミット
git add .
git commit -m "feat: your changes"

# リモートにプッシュ
git push origin feature/i18n-test-environment
```

Vercelが自動的にデプロイを開始します。

---

## 📁 プロジェクト構造

```
pokepoke-trade-app/
├── locales/                    # i18nファイル（NEW）
│   ├── ja/                     # 日本語（マスター）
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── forms.json
│   │   ├── errors.json
│   │   ├── messages.json
│   │   ├── pages.json
│   │   └── cards.json
│   ├── en/                     # 英語
│   ├── zh-cn/                  # 中国語簡体字
│   ├── zh-tw/                  # 中国語繁体字
│   ├── pt-br/                  # ポルトガル語
│   ├── fr/                     # フランス語
│   ├── it/                     # イタリア語
│   ├── de/                     # ドイツ語
│   └── es/                     # スペイン語
├── i18n.ts                     # i18n設定（NEW）
├── middleware.ts               # ルーティング設定（NEW）
├── app/
│   ├── [locale]/               # 言語別ルーティング（NEW）
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── auth/
│   │   ├── trades/
│   │   └── ...
│   └── api/                    # APIルート（言語非依存）
├── components/
│   ├── language-switcher.tsx  # 言語切り替え（NEW）
│   └── ...
└── docs/
    ├── テスト環境構築手順.md          # 詳細手順書（NEW）
    ├── テスト環境構築チェックリスト.md # チェックリスト（NEW）
    └── i18nファイル作成完了サマリー.md # i18n概要（NEW）
```

---

## 💻 開発ガイド

### i18nの使用方法

#### クライアントコンポーネント

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t('pages.home.title')}</h1>
      <button>{t('buttons.login')}</button>
    </div>
  );
}
```

#### サーバーコンポーネント

```typescript
import { getTranslations } from 'next-intl/server';

export default async function ServerPage() {
  const t = await getTranslations();

  return <h1>{t('pages.home.title')}</h1>;
}
```

#### 動的値の埋め込み

```typescript
// 変数を含むメッセージ
t('messages.info.cardsSelected', { count: 5 })
// → "5枚のカードが選択されています"

t('validation.maxSelection', { maxSelection: 20 })
// → "最大20枚まで選択できます。"
```

### 言語切り替えの実装

```typescript
import LanguageSwitcher from '@/components/language-switcher';

// ヘッダーコンポーネントに追加
<LanguageSwitcher />
```

### 新しいテキストの追加

1. `locales/ja/` 内の適切なファイルに追加
2. 他の言語ファイルにも同じキーを追加
3. コンポーネントで使用

```json
// locales/ja/common.json
{
  "buttons": {
    "newButton": "新しいボタン"
  }
}
```

```typescript
// コンポーネント
<button>{t('buttons.newButton')}</button>
```

---

## 🧪 テスト

### ローカルテスト

```bash
# 開発サーバー起動
pnpm dev

# 各言語でアクセス
open http://localhost:3000       # 日本語
open http://localhost:3000/en    # 英語
open http://localhost:3000/zh-cn # 中国語
```

### テスト項目

#### 基本機能
- [ ] 全ページで言語が正しく表示される
- [ ] 言語切り替えが動作する
- [ ] URLに言語コードが含まれる
- [ ] リロード時も言語が保持される

#### 認証
- [ ] ログイン画面が翻訳される
- [ ] エラーメッセージが翻訳される
- [ ] 成功メッセージが翻訳される

#### フォーム
- [ ] ラベルが翻訳される
- [ ] プレースホルダーが翻訳される
- [ ] バリデーションが翻訳される

---

## 🔧 トラブルシューティング

### ビルドエラー

```bash
# 依存関係を再インストール
rm -rf node_modules .next
pnpm install
pnpm build
```

### 言語が切り替わらない

1. ブラウザキャッシュをクリア
2. ハードリロード（Cmd+Shift+R）
3. Middlewareの設定を確認

### Supabase接続エラー

```bash
# 環境変数を確認
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# .env.local の内容を確認
cat .env.local
```

### 翻訳が表示されない

1. ブラウザコンソールでエラーを確認
2. i18n.tsの設定を確認
3. localesファイルのJSONが正しいか確認

---

## 📊 進捗状況

### 完了済み ✅
- [x] i18nファイル構造作成（63ファイル）
- [x] 日本語版（マスター）作成
- [x] ドキュメント作成
- [x] ブランチ作成
- [x] テスト環境構築手順書作成

### 進行中 🚧
- [ ] Supabaseテストデータベース構築
- [ ] i18nライブラリ実装
- [ ] 言語切り替え機能実装
- [ ] Vercelデプロイ

### 未着手 📝
- [ ] 英語翻訳
- [ ] その他言語翻訳
- [ ] 本番環境へのマージ

---

## 🤝 貢献ガイド

### プルリクエストの作成

1. 変更をコミット
```bash
git add .
git commit -m "feat: your feature"
```

2. プッシュ
```bash
git push origin feature/i18n-test-environment
```

3. GitHubでPR作成
   - base: `main`
   - compare: `feature/i18n-test-environment`

### コミットメッセージ規約

```
feat: 新機能
fix: バグ修正
docs: ドキュメント
style: コードスタイル
refactor: リファクタリング
test: テスト
chore: その他
```

---

## 📞 サポート

### 質問・問題報告
- GitHub Issues
- プロジェクトSlackチャンネル
- または直接担当者に連絡

### 参考資料
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

## 📝 変更履歴

### 2025-11-22
- ✅ プロジェクト初期セットアップ
- ✅ i18nファイル構造作成（9言語 × 7ファイル = 63ファイル）
- ✅ 日本語版（マスター）作成完了
- ✅ ドキュメント作成（手順書、チェックリスト、サマリー）
- ✅ テスト環境用ブランチ作成

---

**メンテナー**: Development Team
**最終更新**: 2025-11-22
