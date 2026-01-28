# Supabase Branch活用 - テスト環境構築（簡易版）

**作成日**: 2025-11-22
**所要時間**: 約30分
**前提**: Supabase Proプラン以上（Branching機能が必要）

---

## 🎯 概要

Supabase Branchingを使用して、本番環境のデータベースを簡単に複製し、テスト環境を構築します。

### Supabase Branchingとは？
- 本番データベースのスナップショットを作成
- 独立したテスト環境として使用可能
- スキーマとデータを自動コピー
- Git branchと連携可能

---

## ステップ1: Supabase Branchの作成（5分）

### 1.1 Supabase Dashboardにアクセス

```bash
# ブラウザで本番プロジェクトを開く
https://app.supabase.com/project/YOUR_PROJECT_ID
```

### 1.2 Branchを作成

1. **左サイドバー > Branches** をクリック

2. **Create a new branch** ボタンをクリック

3. **Branch設定**:
   ```
   Branch name: feature/i18n-test-environment
   Based on: Production
   Git branch (optional): feature/i18n-test-environment
   ```

4. **Create branch** をクリック

5. **数分待つ** - データベースのコピーが作成されます

### 1.3 Branch認証情報の取得

Branch作成完了後:

1. **新しいBranch > Settings > API** を開く

2. **以下をコピー**:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   ```

---

## ステップ2: ローカル環境設定（5分）

### 2.1 環境変数ファイルの作成

```bash
# .env.local.test を作成
cat > .env.local.test << 'EOF'
# Supabase Branch (Test Environment)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Environment Identifier
NEXT_PUBLIC_ENV=test
EOF
```

### 2.2 テスト用環境変数に切り替え

```bash
# .env.local を上書き
cp .env.local.test .env.local
```

---

## ステップ3: Vercel環境変数設定（5分）

### 3.1 Vercel Dashboardで設定

1. **https://vercel.com/dashboard** を開く

2. **プロジェクト > Settings > Environment Variables**

3. **Preview環境用の変数を追加**:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Preview |
| `NEXT_PUBLIC_ENV` | `test` | Preview |

4. **Git Branch を指定**: `feature/i18n-test-environment`

5. **Save**

---

## ステップ4: i18nライブラリのインストール（5分）

```bash
# next-intl をインストール
pnpm add next-intl

# 開発依存関係も確認
pnpm add -D @types/node
```

---

## ステップ5: i18n設定ファイルの作成（10分）

### 5.1 i18n.ts を作成

```bash
cat > i18n.ts << 'EOF'
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['ja', 'en', 'zh-cn', 'zh-tw', 'pt-br', 'fr', 'it', 'de', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

export const localeNames: Record<Locale, string> = {
  'ja': '日本語',
  'en': 'English',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  'pt-br': 'Português (Brasil)',
  'fr': 'Français',
  'it': 'Italiano',
  'de': 'Deutsch',
  'es': 'Español',
};

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`./locales/${locale}/common.json`)).default,
  };
});
EOF
```

### 5.2 middleware.ts を作成

```bash
cat > middleware.ts << 'EOF'
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)',],
};
EOF
```

### 5.3 アプリ構造を[locale]配下に移動

```bash
# [locale] ディレクトリを作成
mkdir -p app/[locale]

# 既存ファイルを移動（apiディレクトリ以外）
mv app/layout.tsx app/[locale]/layout.tsx
mv app/page.tsx app/[locale]/page.tsx
mv app/loading.tsx app/[locale]/loading.tsx 2>/dev/null || true

# ディレクトリを移動
for dir in auth trades lists collages contact decks favorites history info matching content; do
  if [ -d "app/$dir" ]; then
    mv app/$dir app/[locale]/$dir
  fi
done

echo "✓ App structure moved to [locale] directory"
```

### 5.4 [locale]/layout.tsx を更新

既存の `app/[locale]/layout.tsx` を以下のように修正:

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`@/locales/${locale}/common.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## ステップ6: 言語切り替えコンポーネント作成（5分）

```bash
cat > components/language-switcher.tsx << 'EOF'
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames } from '@/i18n';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleLocaleChange(e.target.value)}
      className="border rounded px-2 py-1"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}
EOF
```

### ヘッダーに追加

`components/layout/header.tsx` を編集し、LanguageSwitcherを追加:

```typescript
import LanguageSwitcher from '@/components/language-switcher';

// ヘッダー内の適切な場所に追加
<LanguageSwitcher />
```

---

## ステップ7: 動作確認（5分）

### 7.1 ローカルテスト

```bash
# 開発サーバー起動
pnpm dev

# ブラウザで確認
open http://localhost:3000       # 日本語
open http://localhost:3000/en    # 英語
open http://localhost:3000/zh-cn # 中国語
```

### 7.2 確認項目

- [ ] トップページが表示される
- [ ] 言語切り替えが動作する
- [ ] Supabase Branchに接続できる
- [ ] 認証が動作する
- [ ] コンソールエラーがない

---

## ステップ8: GitコミットとVercelデプロイ（5分）

### 8.1 変更をコミット

```bash
git add .
git commit -m "feat: setup i18n with next-intl using Supabase Branch

- Add i18n configuration files
- Setup middleware for locale routing
- Move app structure to [locale] directory
- Add language switcher component
- Configure Supabase Branch for testing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 8.2 リモートにプッシュ

```bash
# プッシュ（Vercel自動デプロイ開始）
git push -u origin feature/i18n-test-environment
```

### 8.3 Vercelデプロイ確認

1. **Vercel Dashboard > Deployments** を開く
2. デプロイの進行状況を確認（3-5分）
3. デプロイ完了後、**Visit** ボタンでプレビューURLを開く

---

## ステップ9: プレビュー環境テスト（5分）

### 9.1 プレビューURLでテスト

```
https://pokepoke-trade-app-git-feature-i18n-xxxxx.vercel.app
```

### 9.2 確認項目

- [ ] 各言語でページが表示される
- [ ] 言語切り替えが動作する
- [ ] Supabase Branchとの接続が正常
- [ ] 認証フローが動作する
- [ ] データの読み書きができる

---

## ✅ 完了チェックリスト

### Supabase
- [ ] Branchが作成された
- [ ] Branch認証情報を取得
- [ ] Branchデータベースが稼働中

### ローカル環境
- [ ] i18n設定ファイル作成
- [ ] app構造を[locale]配下に移動
- [ ] 言語切り替えコンポーネント作成
- [ ] ローカルで動作確認

### Vercel
- [ ] Preview環境変数設定
- [ ] ブランチをプッシュ
- [ ] 自動デプロイ完了
- [ ] プレビューURLで動作確認

---

## 🎉 Supabase Branchingのメリット

### 1. 簡単な作成
- ボタン1つでデータベースコピー
- スキーマとデータが自動複製
- 数分で完了

### 2. 本番環境との分離
- 完全に独立した環境
- 本番データに影響なし
- テストデータで自由に実験可能

### 3. Git連携
- Git branchと自動連携
- ブランチごとに専用DB
- PR作成時に自動作成も可能

### 4. コスト効率
- 使用した分だけ課金
- 不要になったら削除
- 本番より小さいインスタンスも選択可

### 5. スナップショット管理
- 特定時点のデータで検証
- ロールバックが容易
- 本番データベースのバックアップとしても活用

---

## 🔧 Supabase Branch管理

### Branchの確認

```bash
# Supabase CLI（オプション）
npm install -g supabase

# ログイン
supabase login

# Branchリスト表示
supabase branches list
```

### Branchの削除

テスト完了後、不要なBranchを削除:

1. **Supabase Dashboard > Branches**
2. 削除したいBranch > **Settings**
3. **Pause branch** または **Delete branch**

### Branchの更新

本番データベースの最新状態に更新:

1. **Branch > Overview > Reset from production**
2. 最新のスナップショットで上書き

---

## 📊 比較: 従来の方法 vs Supabase Branching

| 項目 | 従来の方法 | Supabase Branching |
|------|-----------|-------------------|
| **セットアップ時間** | 30-60分 | 5-10分 |
| **データベース作成** | 手動で新規プロジェクト | ボタン1つで自動コピー |
| **スキーマコピー** | SQL exportが必要 | 自動コピー |
| **データコピー** | pg_dump/restore | 自動コピー |
| **環境変数管理** | 手動で設定 | 自動生成 |
| **Git連携** | 手動 | 自動連携可能 |
| **削除の手間** | プロジェクト削除 | ワンクリック削除 |
| **コスト** | 常時稼働 | 使用時のみ |

---

## 🚀 次のステップ

### 1. 翻訳作業
- [ ] 英語版の翻訳
- [ ] その他言語の翻訳
- [ ] または自動翻訳スクリプト実行

### 2. コード内の文字列置き換え
- [ ] ハードコードされた文字列をi18nキーに置き換え
- [ ] 各ページ・コンポーネントを順次更新

### 3. テストとデバッグ
- [ ] 全言語で表示確認
- [ ] 長いテキストのレイアウト確認
- [ ] モバイル表示確認

### 4. 本番環境へのマージ
- [ ] Pull Request作成
- [ ] コードレビュー
- [ ] 本番デプロイ

---

## 💡 ベストプラクティス

### Branchのライフサイクル

```
1. Feature開発開始
   └─> Supabase Branch作成

2. 開発・テスト
   └─> Branchで自由に実験

3. PR作成
   └─> プレビュー環境で最終確認

4. マージ
   └─> Branch削除
```

### Branch命名規則

```
feature/機能名
test/テスト名
staging/環境名
```

### 定期的なクリーンアップ

```bash
# 不要なBranchを定期的に削除
# コスト削減とプロジェクト整理
```

---

## 📝 トラブルシューティング

### Branchが作成できない

- Proプラン以上か確認
- 本番DBが正常に稼働しているか確認
- Quota制限に達していないか確認

### Branchへの接続エラー

- 認証情報が正しいか確認
- Branchが"Active"状態か確認
- ネットワーク接続を確認

### データが古い

- Branch > "Reset from production"で最新化
- または新しいBranchを作成

---

## 📚 参考リンク

- [Supabase Branching Documentation](https://supabase.com/docs/guides/platform/branching)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)

---

**作成者**: Claude Code
**最終更新**: 2025-11-22
