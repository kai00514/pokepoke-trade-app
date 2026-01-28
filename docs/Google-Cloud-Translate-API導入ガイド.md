# Google Cloud Translate API 導入ガイド

**作成日**: 2025-11-28
**対象**: pokepoke-trade-app の多言語翻訳機能実装

---

## 📋 目次

1. [Google Cloud プロジェクト作成](#1-google-cloud-プロジェクト作成)
2. [Cloud Translation API 有効化](#2-cloud-translation-api-有効化)
3. [サービスアカウント作成](#3-サービスアカウント作成)
4. [認証情報のダウンロード](#4-認証情報のダウンロード)
5. [ローカル環境設定](#5-ローカル環境設定)
6. [Vercel環境設定](#6-vercel環境設定)
7. [パッケージインストール](#7-パッケージインストール)
8. [基本的な使い方](#8-基本的な使い方)
9. [料金について](#9-料金について)
10. [トラブルシューティング](#10-トラブルシューティング)

---

## 1. Google Cloud プロジェクト作成

### 1-1. Google Cloud Console にアクセス

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Googleアカウントでログイン

### 1-2. 新規プロジェクト作成

1. 画面上部の「プロジェクトを選択」をクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を入力（例: `pokepoke-translate`）
4. 組織を選択（任意）
5. 「作成」をクリック

### 1-3. プロジェクトIDをメモ

- プロジェクト作成後、**プロジェクトID**（例: `pokepoke-translate-123456`）が表示されます
- このIDは後で使用するのでメモしておいてください

---

## 2. Cloud Translation API 有効化

### 2-1. APIライブラリにアクセス

1. 左側のメニューから「APIとサービス」→「ライブラリ」を選択
2. または [こちらのリンク](https://console.cloud.google.com/apis/library) から直接アクセス

### 2-2. Translation API を検索

1. 検索ボックスに「Cloud Translation」と入力
2. 「Cloud Translation API」を選択（**注意**: Advanced版ではなく通常版を選択）

### 2-3. APIを有効化

1. 「有効にする」ボタンをクリック
2. 有効化が完了するまで数秒待機

### 2-4. 課金アカウントの設定（初回のみ）

- 初めてAPIを使用する場合、課金アカウントの設定を求められます
- クレジットカード情報を入力（無料枠があるため、通常の使用では課金されません）
- **無料枠**: 月間50万文字まで無料

---

## 3. サービスアカウント作成

### 3-1. サービスアカウント画面にアクセス

1. 左側のメニューから「IAMと管理」→「サービスアカウント」を選択
2. または [こちらのリンク](https://console.cloud.google.com/iam-admin/serviceaccounts) から直接アクセス

### 3-2. サービスアカウント作成

1. 「サービスアカウントを作成」をクリック
2. 以下の情報を入力：
   - **サービスアカウント名**: `pokepoke-translate`
   - **サービスアカウントID**: 自動生成（例: `pokepoke-translate@pokepoke-translate-123456.iam.gserviceaccount.com`）
   - **説明**: `Translation API用のサービスアカウント`
3. 「作成して続行」をクリック

### 3-3. ロール（権限）を付与

1. 「ロールを選択」のドロップダウンをクリック
2. 検索ボックスに「Cloud Translation」と入力
3. 「Cloud Translation API ユーザー」を選択
4. 「続行」をクリック
5. 「完了」をクリック

---

## 4. 認証情報のダウンロード

### 4-1. キーを作成

1. 作成したサービスアカウントの行の「︙」（縦三点リーダー）をクリック
2. 「キーを管理」を選択
3. 「鍵を追加」→「新しい鍵を作成」をクリック
4. キーのタイプで「JSON」を選択
5. 「作成」をクリック

### 4-2. JSONファイルを保存

- JSONファイルが自動的にダウンロードされます
- ファイル名は `pokepoke-translate-123456-a1b2c3d4e5f6.json` のような形式
- **⚠️ 重要**: このファイルは秘密鍵なので、Gitにコミットしないでください
- 安全な場所に保存してください（例: `~/Downloads/` や専用の認証情報フォルダ）

### 4-3. JSONファイルの内容確認

JSONファイルは以下のような構造です：

```json
{
  "type": "service_account",
  "project_id": "pokepoke-translate-123456",
  "private_key_id": "a1b2c3d4e5f6...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "pokepoke-translate@pokepoke-translate-123456.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

---

## 5. ローカル環境設定

### 5-1. JSONファイルをプロジェクトに配置

```bash
# プロジェクトルートに移動
cd /Users/kaifujishima/workspaces/pokepoke-trade-app

# 認証情報用のディレクトリを作成（任意）
mkdir -p .secrets

# ダウンロードしたJSONファイルを移動
mv ~/Downloads/pokepoke-translate-*.json .secrets/google-cloud-key.json
```

### 5-2. .gitignoreに追加

```bash
# .gitignoreに追加して、誤ってコミットしないようにする
echo ".secrets/" >> .gitignore
echo "google-cloud-key.json" >> .gitignore
```

### 5-3. 環境変数を設定

`.env.local` ファイルに以下を追加：

```bash
# Google Cloud Translation API
GOOGLE_APPLICATION_CREDENTIALS=.secrets/google-cloud-key.json
GOOGLE_CLOUD_PROJECT_ID=pokepoke-translate-123456
```

**⚠️ 注意**: `.env.local` は `.gitignore` に含まれていることを確認してください。

---

## 6. Vercel環境設定

### 6-1. JSONファイルをBase64エンコード

ローカル環境で以下のコマンドを実行：

```bash
# macOS/Linux
base64 -i .secrets/google-cloud-key.json | tr -d '\n' > .secrets/google-cloud-key-base64.txt

# または、より簡潔に
cat .secrets/google-cloud-key.json | base64 | tr -d '\n'
```

出力された長い文字列（Base64エンコード済みのJSON）をコピーします。

### 6-2. Vercel環境変数を設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を選択
4. 以下の環境変数を追加：

| Name | Value | Environment |
|------|-------|-------------|
| `GOOGLE_CLOUD_CREDENTIALS_BASE64` | （Base64エンコードした文字列） | Production, Preview, Development |
| `GOOGLE_CLOUD_PROJECT_ID` | `pokepoke-translate-123456` | Production, Preview, Development |

5. 「Save」をクリック

### 6-3. Vercelでの認証情報デコード

アプリケーション起動時に、Base64エンコードされた認証情報をデコードして使用します。

`lib/google-translate.ts` などで以下のように設定：

```typescript
// Vercel環境ではBase64エンコードされた認証情報をデコード
if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
  const credentials = Buffer.from(
    process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64,
    'base64'
  ).toString('utf-8');

  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = credentials;
}
```

---

## 7. パッケージインストール

### 7-1. Google Cloud Translation パッケージをインストール

```bash
pnpm add @google-cloud/translate
```

### 7-2. 型定義をインストール（TypeScriptの場合）

```bash
pnpm add -D @types/google-cloud__translate
```

---

## 8. 基本的な使い方

### 8-1. 翻訳関数の作成

`lib/google-translate.ts` を作成：

```typescript
import { Translate } from '@google-cloud/translate/v2';

// クライアントを初期化
let translateClient: Translate | null = null;

function getTranslateClient(): Translate {
  if (translateClient) {
    return translateClient;
  }

  // Vercel環境の場合
  if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
    const credentials = JSON.parse(
      Buffer.from(
        process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64,
        'base64'
      ).toString('utf-8')
    );

    translateClient = new Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials,
    });
  } else {
    // ローカル環境の場合（GOOGLE_APPLICATION_CREDENTIALSを使用）
    translateClient = new Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }

  return translateClient;
}

/**
 * テキストを翻訳
 * @param text - 翻訳するテキスト
 * @param sourceLang - 元の言語（例: 'ja'）
 * @param targetLang - 翻訳先の言語（例: 'en'）
 * @returns 翻訳されたテキスト
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  try {
    const translate = getTranslateClient();

    const [translation] = await translate.translate(text, {
      from: sourceLang,
      to: targetLang,
    });

    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * 複数のテキストを一括翻訳
 * @param texts - 翻訳するテキストの配列
 * @param sourceLang - 元の言語
 * @param targetLang - 翻訳先の言語
 * @returns 翻訳されたテキストの配列
 */
export async function translateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[]> {
  try {
    const translate = getTranslateClient();

    const [translations] = await translate.translate(texts, {
      from: sourceLang,
      to: targetLang,
    });

    return Array.isArray(translations) ? translations : [translations];
  } catch (error) {
    console.error('Batch translation error:', error);
    throw new Error(`Batch translation failed: ${error.message}`);
  }
}

/**
 * 言語を検出
 * @param text - 検出するテキスト
 * @returns 検出された言語コード
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const translate = getTranslateClient();
    const [detection] = await translate.detect(text);

    return Array.isArray(detection) ? detection[0].language : detection.language;
  } catch (error) {
    console.error('Language detection error:', error);
    throw new Error(`Language detection failed: ${error.message}`);
  }
}
```

### 8-2. 使用例

```typescript
import { translateText, translateBatch, detectLanguage } from '@/lib/google-translate';

// 単一テキストの翻訳
const translated = await translateText('こんにちは', 'ja', 'en');
console.log(translated); // "Hello"

// 複数テキストの一括翻訳
const texts = ['こんにちは', 'さようなら', 'ありがとう'];
const translations = await translateBatch(texts, 'ja', 'en');
console.log(translations); // ["Hello", "Goodbye", "Thank you"]

// 言語検出
const lang = await detectLanguage('Bonjour');
console.log(lang); // "fr"
```

### 8-3. APIエンドポイントでの使用

```typescript
// app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/google-translate';

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const translation = await translateText(text, sourceLang || 'ja', targetLang);

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
```

---

## 9. 料金について

### 9-1. 無料枠

- **月間50万文字まで無料**
- 無料枠を超えた場合のみ課金されます

### 9-2. 課金料金

| 使用量 | 料金 |
|--------|------|
| 0〜50万文字/月 | 無料 |
| 50万〜10億文字/月 | $20 / 100万文字 |

### 9-3. 概算

**例**: 月間100万文字の翻訳を行う場合

- 無料枠: 50万文字（$0）
- 課金分: 50万文字（$10）
- **合計: $10/月**

### 9-4. 使用量の確認

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 左側のメニューから「お支払い」→「レポート」を選択
3. サービス別の使用量を確認

---

## 10. トラブルシューティング

### 10-1. 認証エラー

**エラーメッセージ**:
```
Error: Could not load the default credentials
```

**解決方法**:
1. 環境変数 `GOOGLE_APPLICATION_CREDENTIALS` が正しく設定されているか確認
2. JSONファイルのパスが正しいか確認
3. JSONファイルの権限を確認（読み取り可能か）

```bash
# 権限を確認
ls -la .secrets/google-cloud-key.json

# 権限を修正（必要に応じて）
chmod 600 .secrets/google-cloud-key.json
```

### 10-2. API無効化エラー

**エラーメッセージ**:
```
Error: Cloud Translation API has not been used in project XXX before or it is disabled
```

**解決方法**:
1. [Google Cloud Console](https://console.cloud.google.com/apis/library/translate.googleapis.com) にアクセス
2. 正しいプロジェクトが選択されているか確認
3. 「有効にする」をクリック

### 10-3. 課金アカウントエラー

**エラーメッセージ**:
```
Error: The billing account for the owning project is disabled
```

**解決方法**:
1. [お支払い設定](https://console.cloud.google.com/billing) にアクセス
2. 課金アカウントが有効になっているか確認
3. クレジットカード情報が最新か確認

### 10-4. レート制限エラー

**エラーメッセージ**:
```
Error: Quota exceeded for quota metric 'Queries' and limit 'Queries per minute'
```

**解決方法**:
- リクエスト間に遅延を追加（例: 100ms）
- バッチ翻訳を使用して、リクエスト数を削減

```typescript
// リクエスト間に遅延を追加
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

for (const text of texts) {
  const translation = await translateText(text, 'ja', 'en');
  await sleep(100); // 100ms待機
}
```

### 10-5. Vercelでのデプロイエラー

**エラーメッセージ**:
```
Error: Cannot find module '@google-cloud/translate'
```

**解決方法**:
1. `package.json` に `@google-cloud/translate` が含まれているか確認
2. Vercelのビルドログを確認
3. 必要に応じて、`pnpm install --frozen-lockfile` を実行してロックファイルを更新

---

## 📝 チェックリスト

導入が完了したら、以下を確認してください：

- [ ] Google Cloud プロジェクトを作成した
- [ ] Cloud Translation API を有効化した
- [ ] サービスアカウントを作成し、適切な権限を付与した
- [ ] 認証情報（JSONファイル）をダウンロードした
- [ ] ローカル環境で環境変数を設定した
- [ ] Vercel環境でBase64エンコードした認証情報を設定した
- [ ] パッケージ（`@google-cloud/translate`）をインストールした
- [ ] 翻訳関数（`lib/google-translate.ts`）を作成した
- [ ] ローカル環境で翻訳をテストした
- [ ] Vercel環境で翻訳をテストした

---

## 🔗 参考リンク

- [Google Cloud Translation API ドキュメント](https://cloud.google.com/translate/docs)
- [Node.js クライアントライブラリ](https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs)
- [料金について](https://cloud.google.com/translate/pricing)
- [サポート言語一覧](https://cloud.google.com/translate/docs/languages)

---

**作成者**: Claude Code
**最終更新**: 2025-11-28
