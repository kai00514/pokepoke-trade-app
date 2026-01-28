-- ============================================================================
-- Phase 2: 多言語対応データベースマイグレーション
-- 作成日: 2025-11-25
-- 目的: JSONB方式による多言語カラムの追加、インデックス作成、既存データ変換
-- ============================================================================

-- トランザクション開始
BEGIN;

-- ============================================================================
-- SECTION 1: 補助テーブル作成（translation_cache, translation_jobs）
-- ============================================================================

RAISE NOTICE '=== SECTION 1: 補助テーブル作成 ===';

-- 1.1 translation_cache（翻訳キャッシュテーブル）
RAISE NOTICE '1.1 Creating translation_cache table...';

CREATE TABLE IF NOT EXISTS translation_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text     TEXT NOT NULL,
  source_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  translated_text TEXT NOT NULL,
  service_used    VARCHAR(50) NOT NULL DEFAULT 'google-translate',
  char_count      INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT translation_cache_unique_key
    UNIQUE(source_text, source_language, target_language)
);

COMMENT ON TABLE translation_cache IS '翻訳APIの結果をキャッシュするテーブル';
COMMENT ON COLUMN translation_cache.source_text IS '元のテキスト';
COMMENT ON COLUMN translation_cache.source_language IS 'ソース言語コード（例: ja, en）';
COMMENT ON COLUMN translation_cache.target_language IS 'ターゲット言語コード';
COMMENT ON COLUMN translation_cache.service_used IS '使用した翻訳サービス（google-translate）';
COMMENT ON COLUMN translation_cache.char_count IS '文字数（課金計算用）';

-- 1.2 translation_jobs（翻訳ジョブキューテーブル）
RAISE NOTICE '1.2 Creating translation_jobs table...';

CREATE TABLE IF NOT EXISTS translation_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name      TEXT NOT NULL,
  record_id       TEXT NOT NULL,
  column_name     TEXT NOT NULL,
  source_language VARCHAR(10) NOT NULL DEFAULT 'ja',
  target_language VARCHAR(10) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message   TEXT,
  attempts        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  CONSTRAINT translation_jobs_unique_key
    UNIQUE(table_name, record_id, column_name, target_language)
);

COMMENT ON TABLE translation_jobs IS 'バックグラウンド翻訳ジョブキュー';
COMMENT ON COLUMN translation_jobs.table_name IS '対象テーブル名';
COMMENT ON COLUMN translation_jobs.record_id IS '対象レコードID';
COMMENT ON COLUMN translation_jobs.column_name IS '対象カラム名';
COMMENT ON COLUMN translation_jobs.status IS 'ジョブステータス（pending/processing/completed/failed）';
COMMENT ON COLUMN translation_jobs.attempts IS '試行回数';

-- ============================================================================
-- SECTION 2: cards テーブル（2カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 2: cards テーブル多言語化 ===';

-- 2.1 カラム追加
RAISE NOTICE '2.1 Adding multilingual columns to cards...';

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS image_url_multilingual JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN cards.name_multilingual IS 'カード名の多言語版（JSONB: {"ja":"ピカチュウex", "en":"Pikachu ex"}）';
COMMENT ON COLUMN cards.image_url_multilingual IS 'カード画像URLの多言語版（JSONB: {"ja":"url1", "en":"url2"}）';

-- 2.2 既存データをJSONBに変換
RAISE NOTICE '2.2 Converting existing data to JSONB format...';

UPDATE cards
SET
  name_multilingual = jsonb_build_object('ja', name),
  image_url_multilingual = jsonb_build_object(
    'ja', image_url,
    'en', COALESCE(game8_image_url, image_url)
  )
WHERE name_multilingual = '{"ja":""}'::jsonb;

-- 2.3 インデックス作成
RAISE NOTICE '2.3 Creating indexes for cards...';

CREATE INDEX IF NOT EXISTS idx_cards_name_multilingual
  ON cards USING GIN(name_multilingual);

CREATE INDEX IF NOT EXISTS idx_cards_image_url_multilingual
  ON cards USING GIN(image_url_multilingual);

-- ============================================================================
-- SECTION 3: packs テーブル（2カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 3: packs テーブル多言語化 ===';

-- 3.1 カラム追加
RAISE NOTICE '3.1 Adding multilingual columns to packs...';

ALTER TABLE packs
  ADD COLUMN IF NOT EXISTS name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS symbol_url_multilingual JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN packs.name_multilingual IS 'パック名の多言語版';
COMMENT ON COLUMN packs.symbol_url_multilingual IS 'パックシンボルURLの多言語版';

-- 3.2 既存データ変換
RAISE NOTICE '3.2 Converting existing pack data...';

UPDATE packs
SET
  name_multilingual = jsonb_build_object('ja', name),
  symbol_url_multilingual = jsonb_build_object('ja', COALESCE(symbol_url, ''))
WHERE name_multilingual = '{"ja":""}'::jsonb;

-- 3.3 インデックス作成
RAISE NOTICE '3.3 Creating indexes for packs...';

CREATE INDEX IF NOT EXISTS idx_packs_name_multilingual
  ON packs USING GIN(name_multilingual);

-- ============================================================================
-- SECTION 4: deck_pages テーブル（17カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 4: deck_pages テーブル多言語化 ===';

-- 4.1 カラム追加
RAISE NOTICE '4.1 Adding 17 multilingual columns to deck_pages...';

ALTER TABLE deck_pages
  ADD COLUMN IF NOT EXISTS title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS deck_name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS deck_description_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evaluation_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS tier_name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS tier_descriptions_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section1_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS section2_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS section3_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS strengths_weaknesses_list_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS strengths_weaknesses_details_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS how_to_play_list_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS how_to_play_steps_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS thumbnail_alt_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deck_badge_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS thumbnail_image_url_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS energy_image_url_multilingual JSONB DEFAULT '{}'::jsonb;

-- 4.2 既存データ変換
RAISE NOTICE '4.2 Converting existing deck_pages data...';

UPDATE deck_pages
SET
  title_multilingual = jsonb_build_object('ja', title),
  deck_name_multilingual = jsonb_build_object('ja', deck_name),
  deck_description_multilingual = jsonb_build_object('ja', COALESCE(deck_description, '')),
  evaluation_title_multilingual = jsonb_build_object('ja', evaluation_title),
  tier_name_multilingual = jsonb_build_object('ja', tier_name),
  tier_descriptions_multilingual = jsonb_build_object('ja', COALESCE(tier_descriptions, '{}'::text[])),
  section1_title_multilingual = jsonb_build_object('ja', section1_title),
  section2_title_multilingual = jsonb_build_object('ja', section2_title),
  section3_title_multilingual = jsonb_build_object('ja', section3_title),
  strengths_weaknesses_list_multilingual = jsonb_build_object('ja', COALESCE(strengths_weaknesses_list, '{}'::text[])),
  strengths_weaknesses_details_multilingual = jsonb_build_object('ja', COALESCE(strengths_weaknesses_details, '[]'::jsonb)),
  how_to_play_list_multilingual = jsonb_build_object('ja', COALESCE(how_to_play_list, '{}'::text[])),
  how_to_play_steps_multilingual = jsonb_build_object('ja', COALESCE(how_to_play_steps, '[]'::jsonb)),
  thumbnail_alt_multilingual = jsonb_build_object('ja', COALESCE(thumbnail_alt, '')),
  deck_badge_multilingual = jsonb_build_object('ja', COALESCE(deck_badge, '')),
  thumbnail_image_url_multilingual = jsonb_build_object('ja', COALESCE(thumbnail_image_url, '')),
  energy_image_url_multilingual = jsonb_build_object('ja', COALESCE(energy_image_url, ''))
WHERE title_multilingual = '{"ja":""}'::jsonb;

-- 4.3 インデックス作成（4個のGINインデックス）
RAISE NOTICE '4.3 Creating indexes for deck_pages...';

CREATE INDEX IF NOT EXISTS idx_deck_pages_title_multilingual
  ON deck_pages USING GIN(title_multilingual);

CREATE INDEX IF NOT EXISTS idx_deck_pages_deck_name_multilingual
  ON deck_pages USING GIN(deck_name_multilingual);

CREATE INDEX IF NOT EXISTS idx_deck_pages_strengths_weaknesses_multilingual
  ON deck_pages USING GIN(strengths_weaknesses_details_multilingual);

CREATE INDEX IF NOT EXISTS idx_deck_pages_how_to_play_multilingual
  ON deck_pages USING GIN(how_to_play_steps_multilingual);

-- ============================================================================
-- SECTION 5: info_pages テーブル（17カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 5: info_pages テーブル多言語化 ===';

-- 5.1 カラム追加（deck_pagesと同じ構造）
RAISE NOTICE '5.1 Adding 17 multilingual columns to info_pages...';

ALTER TABLE info_pages
  ADD COLUMN IF NOT EXISTS title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS deck_name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS deck_description_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evaluation_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS tier_name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS tier_descriptions_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section1_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS section2_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS section3_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS strengths_weaknesses_list_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS strengths_weaknesses_details_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS how_to_play_list_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS how_to_play_steps_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS thumbnail_alt_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deck_badge_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS thumbnail_image_url_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS energy_image_url_multilingual JSONB DEFAULT '{}'::jsonb;

-- 5.2 既存データ変換
RAISE NOTICE '5.2 Converting existing info_pages data...';

UPDATE info_pages
SET
  title_multilingual = jsonb_build_object('ja', title),
  deck_name_multilingual = jsonb_build_object('ja', deck_name),
  deck_description_multilingual = jsonb_build_object('ja', COALESCE(deck_description, '')),
  evaluation_title_multilingual = jsonb_build_object('ja', evaluation_title),
  tier_name_multilingual = jsonb_build_object('ja', tier_name),
  tier_descriptions_multilingual = jsonb_build_object('ja', COALESCE(tier_descriptions, '{}'::text[])),
  section1_title_multilingual = jsonb_build_object('ja', section1_title),
  section2_title_multilingual = jsonb_build_object('ja', section2_title),
  section3_title_multilingual = jsonb_build_object('ja', section3_title),
  strengths_weaknesses_list_multilingual = jsonb_build_object('ja', COALESCE(strengths_weaknesses_list, '{}'::text[])),
  strengths_weaknesses_details_multilingual = jsonb_build_object('ja', COALESCE(strengths_weaknesses_details, '[]'::jsonb)),
  how_to_play_list_multilingual = jsonb_build_object('ja', COALESCE(how_to_play_list, '{}'::text[])),
  how_to_play_steps_multilingual = jsonb_build_object('ja', COALESCE(how_to_play_steps, '[]'::jsonb)),
  thumbnail_alt_multilingual = jsonb_build_object('ja', COALESCE(thumbnail_alt, '')),
  deck_badge_multilingual = jsonb_build_object('ja', COALESCE(deck_badge, '')),
  thumbnail_image_url_multilingual = jsonb_build_object('ja', COALESCE(thumbnail_image_url, '')),
  energy_image_url_multilingual = jsonb_build_object('ja', COALESCE(energy_image_url, ''))
WHERE title_multilingual = '{"ja":""}'::jsonb;

-- 5.3 インデックス作成（4個のGINインデックス）
RAISE NOTICE '5.3 Creating indexes for info_pages...';

CREATE INDEX IF NOT EXISTS idx_info_pages_title_multilingual
  ON info_pages USING GIN(title_multilingual);

CREATE INDEX IF NOT EXISTS idx_info_pages_deck_name_multilingual
  ON info_pages USING GIN(deck_name_multilingual);

CREATE INDEX IF NOT EXISTS idx_info_pages_strengths_weaknesses_multilingual
  ON info_pages USING GIN(strengths_weaknesses_details_multilingual);

CREATE INDEX IF NOT EXISTS idx_info_pages_how_to_play_multilingual
  ON info_pages USING GIN(how_to_play_steps_multilingual);

-- ============================================================================
-- SECTION 6: info_articles テーブル（6カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 6: info_articles テーブル多言語化 ===';

-- 6.1 カラム追加
RAISE NOTICE '6.1 Adding 6 multilingual columns to info_articles...';

ALTER TABLE info_articles
  ADD COLUMN IF NOT EXISTS title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS subtitle_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS excerpt_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS thumbnail_image_url_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_image_url_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tags_multilingual JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN info_articles.title_multilingual IS '記事タイトルの多言語版';
COMMENT ON COLUMN info_articles.subtitle_multilingual IS 'サブタイトルの多言語版';
COMMENT ON COLUMN info_articles.excerpt_multilingual IS '抜粋の多言語版';
COMMENT ON COLUMN info_articles.tags_multilingual IS 'タグの多言語版（配列形式）';

-- 6.2 既存データ変換
RAISE NOTICE '6.2 Converting existing info_articles data...';

UPDATE info_articles
SET
  title_multilingual = jsonb_build_object('ja', title),
  subtitle_multilingual = jsonb_build_object('ja', COALESCE(subtitle, '')),
  excerpt_multilingual = jsonb_build_object('ja', COALESCE(excerpt, '')),
  thumbnail_image_url_multilingual = jsonb_build_object('ja', COALESCE(thumbnail_image_url, '')),
  hero_image_url_multilingual = jsonb_build_object('ja', COALESCE(hero_image_url, '')),
  tags_multilingual = jsonb_build_object('ja', COALESCE(tags, '{}'::text[]))
WHERE title_multilingual = '{"ja":""}'::jsonb;

-- 6.3 インデックス作成
RAISE NOTICE '6.3 Creating indexes for info_articles...';

CREATE INDEX IF NOT EXISTS idx_info_articles_title_multilingual
  ON info_articles USING GIN(title_multilingual);

CREATE INDEX IF NOT EXISTS idx_info_articles_tags_multilingual
  ON info_articles USING GIN(tags_multilingual);

-- ============================================================================
-- SECTION 7: info_article_blocks テーブル（1カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 7: info_article_blocks テーブル多言語化 ===';

-- 7.1 カラム追加
RAISE NOTICE '7.1 Adding data_multilingual column to info_article_blocks...';

ALTER TABLE info_article_blocks
  ADD COLUMN IF NOT EXISTS data_multilingual JSONB NOT NULL DEFAULT '{"ja":{}}'::jsonb;

COMMENT ON COLUMN info_article_blocks.data_multilingual IS 'ブロックデータの多言語版';

-- 7.2 既存データ変換
RAISE NOTICE '7.2 Converting existing info_article_blocks data...';

UPDATE info_article_blocks
SET data_multilingual = jsonb_build_object('ja', data)
WHERE data_multilingual = '{"ja":{}}'::jsonb;

-- 7.3 インデックス作成
RAISE NOTICE '7.3 Creating indexes for info_article_blocks...';

CREATE INDEX IF NOT EXISTS idx_info_article_blocks_data_multilingual
  ON info_article_blocks USING GIN(data_multilingual);

-- ============================================================================
-- SECTION 8: tournaments テーブル（2カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 8: tournaments テーブル多言語化 ===';

-- 8.1 カラム追加
RAISE NOTICE '8.1 Adding multilingual columns to tournaments...';

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS benefit_multilingual JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN tournaments.title_multilingual IS '大会タイトルの多言語版';
COMMENT ON COLUMN tournaments.benefit_multilingual IS '特典の多言語版';

-- 8.2 既存データ変換
RAISE NOTICE '8.2 Converting existing tournaments data...';

UPDATE tournaments
SET
  title_multilingual = jsonb_build_object('ja', title),
  benefit_multilingual = jsonb_build_object('ja', COALESCE(benefit, ''))
WHERE title_multilingual = '{"ja":""}'::jsonb;

-- 8.3 インデックス作成
RAISE NOTICE '8.3 Creating indexes for tournaments...';

CREATE INDEX IF NOT EXISTS idx_tournaments_title_multilingual
  ON tournaments USING GIN(title_multilingual);

-- ============================================================================
-- SECTION 9: decks テーブル（2カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 9: decks テーブル多言語化 ===';

-- 9.1 カラム追加
RAISE NOTICE '9.1 Adding multilingual columns to decks...';

ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_multilingual JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN decks.title_multilingual IS 'デッキタイトルの多言語版';
COMMENT ON COLUMN decks.description_multilingual IS 'デッキ説明の多言語版';

-- 9.2 既存データ変換
RAISE NOTICE '9.2 Converting existing decks data...';

UPDATE decks
SET
  title_multilingual = jsonb_build_object('ja', title),
  description_multilingual = jsonb_build_object('ja', COALESCE(description, ''))
WHERE title_multilingual = '{"ja":""}'::jsonb;

-- 9.3 インデックス作成
RAISE NOTICE '9.3 Creating indexes for decks...';

CREATE INDEX IF NOT EXISTS idx_decks_title_multilingual
  ON decks USING GIN(title_multilingual);

-- ============================================================================
-- SECTION 10: trade_posts テーブル（2カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 10: trade_posts テーブル多言語化 ===';

-- 10.1 カラム追加
RAISE NOTICE '10.1 Adding multilingual columns to trade_posts...';

ALTER TABLE trade_posts
  ADD COLUMN IF NOT EXISTS title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS comment_multilingual JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN trade_posts.title_multilingual IS 'トレード投稿タイトルの多言語版';
COMMENT ON COLUMN trade_posts.comment_multilingual IS 'コメントの多言語版';

-- 10.2 既存データ変換
RAISE NOTICE '10.2 Converting existing trade_posts data...';

UPDATE trade_posts
SET
  title_multilingual = jsonb_build_object('ja', title),
  comment_multilingual = jsonb_build_object('ja', COALESCE(comment, ''))
WHERE title_multilingual = '{"ja":""}'::jsonb;

-- 10.3 インデックス作成
RAISE NOTICE '10.3 Creating indexes for trade_posts...';

CREATE INDEX IF NOT EXISTS idx_trade_posts_title_multilingual
  ON trade_posts USING GIN(title_multilingual);

-- ============================================================================
-- SECTION 11: user_collages テーブル（2カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 11: user_collages テーブル多言語化 ===';

-- 11.1 カラム追加
RAISE NOTICE '11.1 Adding multilingual columns to user_collages...';

ALTER TABLE user_collages
  ADD COLUMN IF NOT EXISTS title1_multilingual JSONB NOT NULL DEFAULT '{"ja":"求めるカード"}'::jsonb,
  ADD COLUMN IF NOT EXISTS title2_multilingual JSONB NOT NULL DEFAULT '{"ja":"譲れるカード"}'::jsonb;

COMMENT ON COLUMN user_collages.title1_multilingual IS 'タイトル1の多言語版';
COMMENT ON COLUMN user_collages.title2_multilingual IS 'タイトル2の多言語版';

-- 11.2 既存データ変換
RAISE NOTICE '11.2 Converting existing user_collages data...';

UPDATE user_collages
SET
  title1_multilingual = jsonb_build_object('ja', title1),
  title2_multilingual = jsonb_build_object('ja', title2)
WHERE title1_multilingual = '{"ja":"求めるカード"}'::jsonb;

-- ============================================================================
-- SECTION 12: notifications テーブル（1カラム追加）
-- ============================================================================

RAISE NOTICE '=== SECTION 12: notifications テーブル多言語化 ===';

-- 12.1 カラム追加
RAISE NOTICE '12.1 Adding multilingual column to notifications...';

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS payload_multilingual JSONB NOT NULL DEFAULT '{"ja":{}}'::jsonb;

COMMENT ON COLUMN notifications.payload_multilingual IS '通知ペイロードの多言語版';

-- 12.2 既存データ変換
RAISE NOTICE '12.2 Converting existing notifications data...';

UPDATE notifications
SET payload_multilingual = jsonb_build_object('ja', payload)
WHERE payload_multilingual = '{"ja":{}}'::jsonb;

-- 12.3 インデックス作成
RAISE NOTICE '12.3 Creating indexes for notifications...';

CREATE INDEX IF NOT EXISTS idx_notifications_payload_multilingual
  ON notifications USING GIN(payload_multilingual);

-- ============================================================================
-- SECTION 13: 補助テーブルのインデックス作成
-- ============================================================================

RAISE NOTICE '=== SECTION 13: 補助テーブルのインデックス作成 ===';

-- 13.1 translation_cache インデックス
RAISE NOTICE '13.1 Creating indexes for translation_cache...';

CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup
  ON translation_cache(source_text, source_language, target_language);

CREATE INDEX IF NOT EXISTS idx_translation_cache_created
  ON translation_cache(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_translation_cache_service
  ON translation_cache(service_used);

-- 13.2 translation_jobs インデックス
RAISE NOTICE '13.2 Creating indexes for translation_jobs...';

CREATE INDEX IF NOT EXISTS idx_translation_jobs_status
  ON translation_jobs(status, created_at);

CREATE INDEX IF NOT EXISTS idx_translation_jobs_table_record
  ON translation_jobs(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_translation_jobs_target_language
  ON translation_jobs(target_language);

-- ============================================================================
-- SECTION 14: RLS (Row Level Security) ポリシー設定
-- ============================================================================

RAISE NOTICE '=== SECTION 14: RLS ポリシー設定 ===';

-- 14.1 translation_cache のRLS
RAISE NOTICE '14.1 Setting RLS for translation_cache...';

ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read access to translation cache"
  ON translation_cache FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage translation cache"
  ON translation_cache FOR ALL
  USING (auth.role() = 'authenticated');

-- 14.2 translation_jobs のRLS
RAISE NOTICE '14.2 Setting RLS for translation_jobs...';

ALTER TABLE translation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow read access to translation jobs"
  ON translation_jobs FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage translation jobs"
  ON translation_jobs FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- SECTION 15: 統計情報更新
-- ============================================================================

RAISE NOTICE '=== SECTION 15: 統計情報更新 ===';

ANALYZE cards;
ANALYZE packs;
ANALYZE deck_pages;
ANALYZE info_pages;
ANALYZE info_articles;
ANALYZE info_article_blocks;
ANALYZE tournaments;
ANALYZE decks;
ANALYZE trade_posts;
ANALYZE user_collages;
ANALYZE notifications;
ANALYZE translation_cache;
ANALYZE translation_jobs;

-- ============================================================================
-- 完了
-- ============================================================================

RAISE NOTICE '=======================================================';
RAISE NOTICE 'Phase 2 マイグレーション完了！';
RAISE NOTICE '=======================================================';
RAISE NOTICE '追加されたカラム数: 54';
RAISE NOTICE '作成されたインデックス数: 21（GIN）+ 5（BTREE）= 26';
RAISE NOTICE '新規テーブル数: 2（translation_cache, translation_jobs）';
RAISE NOTICE '=======================================================';

-- トランザクション完了
COMMIT;
