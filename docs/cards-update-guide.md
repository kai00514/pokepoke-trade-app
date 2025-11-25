# カードメタデータ更新ガイド

**作成日**: 2025-11-25
**対象**: cards テーブルの col_3, col_4, col_5 カラム更新

---

## 📋 概要

このガイドでは、CSVファイル（`docs/cards_update.csv`）を使用して、`cards` テーブルのメタデータカラム（`col_3`, `col_4`, `col_5`）を一括更新する手順を説明します。

### 対象カラム

| カラム名 | 説明 | 例 |
|---------|------|-----|
| `col_3` | パック識別子 | `PROMO-A`, `A1` |
| `col_4` | カード番号 | `014/P-A`, `286/228` |
| `col_5` | フルID | `P-A-014`, `A1-286` |

### 更新対象レコード数

**2,259件**

---

## 🚀 実行手順

### ステップ1: SQLファイル生成（既に完了）

```bash
# CSVからUPDATE SQLを生成
node scripts/generate-cards-update-sql.js

# 出力: scripts/update-cards-metadata.sql
```

### ステップ2: データベース接続確認

```bash
# テスト環境で接続確認
psql "postgresql://postgres:iZVIKuRfhhGmplxwjduVeUWLEiTisaui@db.oflucnwezzqqtxryonhf.supabase.co:5432/postgres" \
  -c "SELECT count(*) FROM cards WHERE id BETWEEN 3101 AND 5359;"
```

期待される結果: `2259`（またはそれ以上）

### ステップ3: バックアップ作成（推奨）

```bash
# 現在のcardsテーブルをバックアップ
psql "$POSTGRES_URL" -c "
CREATE TABLE cards_backup_$(date +%Y%m%d) AS
SELECT * FROM cards WHERE id BETWEEN 3101 AND 5359;
"

# バックアップ確認
psql "$POSTGRES_URL" -c "SELECT count(*) FROM cards_backup_$(date +%Y%m%d);"
```

### ステップ4: 実行前確認

```bash
# 更新前のサンプルデータ確認
psql "$POSTGRES_URL" -c "
SELECT id, name, col_3, col_4, col_5
FROM cards
WHERE id IN (3101, 3102, 3103, 3104, 3105)
ORDER BY id;
"
```

**現在の状態**:
```
  id  |    name     | col_3 | col_4 | col_5
------+-------------+-------+-------+-------
 3101 | ラプラスex   | NULL  | NULL  | NULL
 3102 | バタフリー   | NULL  | NULL  | NULL
```

### ステップ5: UPDATE SQL実行

```bash
# テスト環境で実行
psql "postgresql://postgres:iZVIKuRfhhGmplxwjduVeUWLEiTisaui@db.oflucnwezzqqtxryonhf.supabase.co:5432/postgres" \
  -f scripts/update-cards-metadata.sql

# または本番環境で実行
psql "$POSTGRES_URL" -f scripts/update-cards-metadata.sql
```

**実行時の出力例**:
```
BEGIN
CREATE TABLE
INSERT 0 2259
UPDATE 2259
NOTICE:  更新されたレコード数: 2259
DROP TABLE
  id  |      name      |  col_3   |  col_4   |  col_5
------+----------------+----------+----------+---------
 3101 | ラプラスex      | PROMO-A  | 014/P-A  | P-A-014
 3102 | バタフリー      | PROMO-A  | 013/P-A  | P-A-013
 3103 | ニャース        | PROMO-A  | 012/P-A  | P-A-012
 3104 | ラッキー        | PROMO-A  | 011/P-A  | P-A-011
 3105 | ピカチュウ      | PROMO-A  | 009/P-A  | P-A-009
(5 rows)

COMMIT
```

### ステップ6: 更新結果確認

```bash
# 更新されたレコード数を確認
psql "$POSTGRES_URL" -c "
SELECT
  count(*) as total_cards,
  count(col_3) as col_3_filled,
  count(col_4) as col_4_filled,
  count(col_5) as col_5_filled
FROM cards
WHERE id BETWEEN 3101 AND 5359;
"
```

**期待される結果**:
```
 total_cards | col_3_filled | col_4_filled | col_5_filled
-------------+--------------+--------------+--------------
        2259 |         2259 |         2259 |         2259
```

### ステップ7: ランダムサンプル確認

```bash
psql "$POSTGRES_URL" -c "
SELECT id, name, col_3, col_4, col_5
FROM cards
WHERE id IN (3101, 3150, 3200, 3500, 4000, 5000)
ORDER BY id;
"
```

---

## 🔍 SQLファイルの構造

### 使用する手法

**一時テーブルを使用した効率的な一括更新**

```sql
BEGIN;

-- 1. 一時テーブル作成
CREATE TEMP TABLE temp_card_updates (
  id BIGINT,
  col_3 TEXT,
  col_4 TEXT,
  col_5 TEXT
);

-- 2. CSVデータを一時テーブルに挿入
INSERT INTO temp_card_updates (id, col_3, col_4, col_5) VALUES
  (3101, 'PROMO-A', '014/P-A', 'P-A-014'),
  (3102, 'PROMO-A', '013/P-A', 'P-A-013'),
  -- ... 2259行
  ;

-- 3. 一括更新実行
UPDATE cards
SET
  col_3 = temp.col_3,
  col_4 = temp.col_4,
  col_5 = temp.col_5
FROM temp_card_updates temp
WHERE cards.id = temp.id;

-- 4. 更新数確認
-- 5. サンプル表示
-- 6. 一時テーブル削除

COMMIT;
```

### メリット

- ✅ トランザクション内で実行されるため、エラー時は自動ロールバック
- ✅ 2,259件を一括で効率的に更新
- ✅ 実行時間: 約1-3秒
- ✅ 更新確認が自動で実行される

---

## ⚠️ トラブルシューティング

### エラー1: レコードが存在しない

```
WARNING: 期待されたレコード数(2259)と実際の更新数(XXXX)が一致しません
```

**原因**: CSVのIDに対応するレコードがDBに存在しない

**対処**:
```sql
-- 存在しないIDを確認
SELECT t.id
FROM temp_card_updates t
LEFT JOIN cards c ON t.id = c.id
WHERE c.id IS NULL;
```

### エラー2: カラムが存在しない

```
ERROR:  column "col_3" does not exist
```

**原因**: cardsテーブルに対象カラムが存在しない

**対処**:
```sql
-- カラムを追加
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS col_3 TEXT,
  ADD COLUMN IF NOT EXISTS col_4 TEXT,
  ADD COLUMN IF NOT EXISTS col_5 TEXT;
```

### エラー3: トランザクションタイムアウト

```
ERROR:  canceling statement due to statement timeout
```

**対処**:
```bash
# タイムアウトを延長
psql "$POSTGRES_URL" -c "SET statement_timeout = '5min';"
psql "$POSTGRES_URL" -f scripts/update-cards-metadata.sql
```

---

## 🔄 ロールバック手順

### 方法1: バックアップから復元

```sql
-- バックアップテーブルから復元
UPDATE cards c
SET
  col_3 = b.col_3,
  col_4 = b.col_4,
  col_5 = b.col_5
FROM cards_backup_20251125 b
WHERE c.id = b.id;
```

### 方法2: カラムをNULLにリセット

```sql
UPDATE cards
SET
  col_3 = NULL,
  col_4 = NULL,
  col_5 = NULL
WHERE id BETWEEN 3101 AND 5359;
```

---

## 📊 パフォーマンス情報

### 実行時間（予想）

| レコード数 | 実行時間 |
|----------|---------|
| 2,259件 | 1-3秒 |

### データベース影響

- **テーブルロック**: 短時間（1-3秒）のみ
- **インデックス再構築**: 不要（既存カラムの更新のみ）
- **容量増加**: 約10-50KB（TEXT型3カラム × 2259行）

### 本番環境での実行推奨

- ✅ メンテナンス時間中に実行
- ✅ または低トラフィック時間帯（深夜）
- ⚠️ ただし、更新時間が短いため影響は最小限

---

## 📝 実行レポートテンプレート

```markdown
# カードメタデータ更新 実行レポート

## 実行情報
- **実行日時**: 2025-XX-XX XX:XX:XX
- **実行者**: [担当者名]
- **環境**: [本番/テスト]
- **所要時間**: X秒

## 実行結果
- ✅ 2,259件のレコードを更新
- ✅ col_3, col_4, col_5 が正常に設定された
- ✅ データ整合性確認完了

## 確認事項
- [x] バックアップ作成済み
- [x] 更新前データ確認済み
- [x] 更新後データ確認済み
- [x] サンプルレコード確認済み

## 問題・警告
[なし / 問題の詳細]
```

---

## 🎯 次のステップ

このメタデータ更新完了後：

1. **多言語カードデータCSVインポート** (`docs/多言語対応カードデータ.csv`)
2. **Phase 2マイグレーション実行** (多言語カラム追加)
3. **CSVから多言語データをJSONBに変換・インポート**

---

**作成者**: Claude Code
**最終更新**: 2025-11-25
