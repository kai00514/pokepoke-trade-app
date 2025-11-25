# Phase 2: マイグレーション実行ガイド

**作成日**: 2025-11-25
**対象**: データベース多言語化マイグレーション

---

## 📋 事前準備チェックリスト

### 1. バックアップ作成（必須）

```bash
# 本番データベースのバックアップ
pg_dump "本番のPOSTGRES_URL" \
  --no-owner --no-acl --schema=public \
  -f backups/pre-i18n-migration-$(date +%Y%m%d-%H%M%S).sql

# バックアップの確認
ls -lh backups/
```

### 2. テスト環境で実行（推奨）

```bash
# Supabase Preview Branchで実行
psql "postgresql://postgres:iZVIKuRfhhGmplxwjduVeUWLEiTisaui@db.oflucnwezzqqtxryonhf.supabase.co:5432/postgres" \
  -f scripts/phase2-i18n-migration.sql
```

### 3. 実行時間の見積もり

| データベースサイズ | 予想実行時間 |
|-----------------|------------|
| < 1GB | 5-10分 |
| 1-5GB | 10-30分 |
| 5-10GB | 30-60分 |
| > 10GB | 60分以上 |

**注意**: トランザクション内で実行されるため、完了まで待つ必要があります。

---

## 🚀 マイグレーション実行手順

### ステップ1: データベース接続確認

```bash
# 接続テスト
psql "$POSTGRES_URL" -c "SELECT version();"
```

### ステップ2: 現在のデータベースサイズ確認

```bash
psql "$POSTGRES_URL" -c "
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  (SELECT count(*) FROM cards) as cards_count,
  (SELECT count(*) FROM decks) as decks_count,
  (SELECT count(*) FROM trade_posts) as trade_posts_count;
"
```

### ステップ3: マイグレーション実行

```bash
# メインマイグレーション実行
psql "$POSTGRES_URL" -f scripts/phase2-i18n-migration.sql 2>&1 | tee logs/migration-$(date +%Y%m%d-%H%M%S).log
```

**実行中の出力例**:
```
NOTICE:  === SECTION 1: 補助テーブル作成 ===
NOTICE:  1.1 Creating translation_cache table...
NOTICE:  1.2 Creating translation_jobs table...
NOTICE:  === SECTION 2: cards テーブル多言語化 ===
...
NOTICE:  =======================================================
NOTICE:  Phase 2 マイグレーション完了！
NOTICE:  =======================================================
NOTICE:  追加されたカラム数: 54
NOTICE:  作成されたインデックス数: 21（GIN）+ 5（BTREE）= 26
NOTICE:  新規テーブル数: 2（translation_cache, translation_jobs）
NOTICE:  =======================================================
COMMIT
```

### ステップ4: 結果確認

```bash
# 多言語カラムが追加されたか確認
psql "$POSTGRES_URL" -c "
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%_multilingual'
ORDER BY table_name, column_name;
"
```

期待される出力（54行）:
```
      table_name       |              column_name               | data_type
-----------------------+----------------------------------------+-----------
 cards                 | image_url_multilingual                 | jsonb
 cards                 | name_multilingual                      | jsonb
 deck_pages            | deck_badge_multilingual                | jsonb
 deck_pages            | deck_description_multilingual          | jsonb
 deck_pages            | deck_name_multilingual                 | jsonb
 ...
```

### ステップ5: インデックス確認

```bash
psql "$POSTGRES_URL" -c "
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%multilingual%'
ORDER BY tablename, indexname;
"
```

### ステップ6: データサンプル確認

```bash
# cards テーブルのサンプル確認
psql "$POSTGRES_URL" -c "
SELECT
  id,
  name,
  name_multilingual,
  image_url_multilingual
FROM cards
LIMIT 5;
"
```

期待される出力:
```
  id  |      name      |       name_multilingual        |         image_url_multilingual
------+----------------+--------------------------------+---------------------------------------
 3101 | ラプラスex      | {"ja": "ラプラスex"}           | {"en": "https://...", "ja": "https://..."}
 3102 | バタフリー      | {"ja": "バタフリー"}           | {"en": "https://...", "ja": "https://..."}
```

---

## ⚠️ トラブルシューティング

### エラー1: カラムが既に存在する

```
ERROR:  column "name_multilingual" of relation "cards" already exists
```

**原因**: マイグレーションが既に実行されている

**対処**:
```bash
# ロールバック実行
psql "$POSTGRES_URL" -f scripts/phase2-i18n-rollback.sql

# 再度マイグレーション実行
psql "$POSTGRES_URL" -f scripts/phase2-i18n-migration.sql
```

### エラー2: メモリ不足

```
ERROR:  out of memory
DETAIL:  Failed on request of size XXX
```

**原因**: 大量データの一括UPDATE

**対処**:
```sql
-- バッチ処理に変更（例: cards テーブル）
UPDATE cards
SET name_multilingual = jsonb_build_object('ja', name)
WHERE id IN (
  SELECT id FROM cards
  WHERE name_multilingual = '{"ja":""}'::jsonb
  LIMIT 10000
);
-- 上記を繰り返し実行
```

### エラー3: タイムアウト

```
ERROR:  canceling statement due to statement timeout
```

**対処**:
```bash
# タイムアウトを延長
psql "$POSTGRES_URL" -c "SET statement_timeout = '30min';"
psql "$POSTGRES_URL" -f scripts/phase2-i18n-migration.sql
```

### エラー4: トランザクションロック

```
ERROR:  could not obtain lock on relation "cards"
```

**原因**: 他のクエリがテーブルをロックしている

**対処**:
```bash
# メンテナンスモードに移行
# または深夜など低トラフィック時に実行
```

---

## 🔄 ロールバック手順

### いつロールバックするか

- マイグレーション中にエラーが発生した場合
- 予期しない動作が確認された場合
- テストで問題が見つかった場合

### ロールバック実行

```bash
# 警告: すべての多言語データが削除されます
psql "$POSTGRES_URL" -f scripts/phase2-i18n-rollback.sql 2>&1 | tee logs/rollback-$(date +%Y%m%d-%H%M%S).log
```

### ロールバック確認

```bash
# 多言語カラムが削除されたか確認
psql "$POSTGRES_URL" -c "
SELECT count(*)
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%_multilingual';
"
```

期待される結果: `0`

---

## 📊 実行後の確認項目

### 1. データ整合性チェック

```sql
-- すべてのcardsに日本語名が入っているか
SELECT count(*) FROM cards
WHERE name_multilingual->>'ja' IS NULL OR name_multilingual->>'ja' = '';

-- 結果: 0 であること
```

### 2. インデックスの有効性確認

```sql
-- インデックスが使用されているか確認
EXPLAIN ANALYZE
SELECT * FROM cards
WHERE name_multilingual @> '{"ja":"ピカチュウex"}'::jsonb;

-- "Bitmap Index Scan on idx_cards_name_multilingual" が表示されること
```

### 3. パフォーマンステスト

```sql
-- 検索速度テスト（1秒以内に完了すること）
\timing on
SELECT * FROM cards WHERE name_multilingual->>'ja' LIKE '%ピカチュウ%' LIMIT 10;
\timing off
```

### 4. データベースサイズの変化確認

```sql
SELECT
  pg_size_pretty(pg_database_size(current_database())) as new_size,
  pg_size_pretty(pg_total_relation_size('cards')) as cards_table_size,
  pg_size_pretty(pg_indexes_size('cards')) as cards_indexes_size;
```

**予想される増加量**: 元のサイズの 10-20%

---

## 📝 実行レポート作成

マイグレーション完了後、以下の情報を記録してください：

```markdown
# Phase 2 マイグレーション実行レポート

## 実行情報
- **実行日時**: 2025-XX-XX XX:XX:XX
- **実行者**: [担当者名]
- **環境**: [本番/テスト]
- **所要時間**: XX分XX秒

## 実行前のデータベース状態
- データベースサイズ: XX GB
- cards レコード数: XXXX
- decks レコード数: XXXX
- trade_posts レコード数: XXXX

## 実行結果
- ✅ 補助テーブル作成完了
- ✅ 54カラム追加完了
- ✅ 既存データ変換完了
- ✅ 26インデックス作成完了

## 実行後のデータベース状態
- データベースサイズ: XX GB（増加: +XX GB / +XX%）
- 多言語カラム数: 54
- インデックス数: 26

## 問題・警告
- [なし / 問題の詳細]

## 次のステップ
- [ ] Phase 3: API実装
- [ ] Phase 4: 翻訳データ投入
```

---

## 🎯 次のステップ

マイグレーション完了後の作業：

### 1. CSVカードデータインポート準備

```bash
# CSVインポートスクリプト作成（Phase 4）
# docs/多言語対応カードデータ.csv を使用
```

### 2. API実装準備

```bash
# lib/i18n-helpers.ts 作成
# JSONB抽出ヘルパー関数実装
```

### 3. 翻訳サービス設定

```bash
# Google Cloud Translate API設定
# 認証情報設定
```

---

## 📞 サポート

問題が発生した場合：

1. **ログファイル確認**: `logs/migration-YYYYMMDD-HHMMSS.log`
2. **GitHub Issues**: プロジェクトリポジトリのIssuesに報告
3. **Slack**: プロジェクトチャンネルで質問

---

## ⚡ クイックリファレンス

```bash
# テスト環境で実行
psql "$TEST_DB_URL" -f scripts/phase2-i18n-migration.sql

# 本番環境で実行（バックアップ後）
pg_dump "$PROD_DB_URL" -f backups/pre-migration.sql
psql "$PROD_DB_URL" -f scripts/phase2-i18n-migration.sql

# ロールバック
psql "$DB_URL" -f scripts/phase2-i18n-rollback.sql

# 結果確認
psql "$DB_URL" -c "SELECT count(*) FROM information_schema.columns WHERE column_name LIKE '%_multilingual';"
```

---

**作成者**: Claude Code
**最終更新**: 2025-11-25
