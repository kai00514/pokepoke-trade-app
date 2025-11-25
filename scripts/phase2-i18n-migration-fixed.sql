-- ============================================================================
-- Phase 2: 多言語対応データベースマイグレーション（修正版）
-- 作成日: 2025-11-25
-- 目的: JSONB方式による多言語カラムの追加、インデックス作成、既存データ変換
-- ============================================================================

-- トランザクション開始
BEGIN;

\echo '=== SECTION 1: 補助テーブル作成 ==='

-- 1.1 translation_cache（翻訳キャッシュテーブル）
\echo '1.1 Creating translation_cache table...'

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

-- 1.2 translation_jobs（翻訳ジョブキューテーブル）
\echo '1.2 Creating translation_jobs table...'

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

-- ============================================================================
-- SECTION 2: cards テーブル（2カラム追加）
-- ============================================================================

\echo '=== SECTION 2: cards テーブル多言語化 ==='

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS image_url_multilingual JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE cards
SET
  name_multilingual = jsonb_build_object('ja', name),
  image_url_multilingual = jsonb_build_object(
    'ja', image_url,
    'en', COALESCE(game8_image_url, image_url)
  )
WHERE name_multilingual = '{"ja":""}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_cards_name_multilingual
  ON cards USING GIN(name_multilingual);

CREATE INDEX IF NOT EXISTS idx_cards_image_url_multilingual
  ON cards USING GIN(image_url_multilingual);

-- ============================================================================
-- SECTION 3: packs テーブル（2カラム追加）
-- ============================================================================

\echo '=== SECTION 3: packs テーブル多言語化 ==='

ALTER TABLE packs
  ADD COLUMN IF NOT EXISTS name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS symbol_url_multilingual JSONB DEFAULT '{}'::jsonb;

UPDATE packs
SET
  name_multilingual = jsonb_build_object('ja', name),
  symbol_url_multilingual = jsonb_build_object('ja', COALESCE(symbol_url, ''))
WHERE name_multilingual = '{"ja":""}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_packs_name_multilingual
  ON packs USING GIN(name_multilingual);

-- ============================================================================
-- SECTION 4: deck_pages テーブル（17カラム追加）
-- ============================================================================

\echo '=== SECTION 4: deck_pages テーブル多言語化 ==='

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

\echo '=== SECTION 5: info_pages テーブル多言語化 ==='

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

CREATE INDEX IF NOT EXISTS idx_info_pages_title_multilingual
  ON info_pages USING GIN(title_multilingual);
CREATE INDEX IF NOT EXISTS idx_info_pages_deck_name_multilingual
  ON info_pages USING GIN(deck_name_multilingual);
CREATE INDEX IF NOT EXISTS idx_info_pages_strengths_weaknesses_multilingual
  ON info_pages USING GIN(strengths_weaknesses_details_multilingual);
CREATE INDEX IF NOT EXISTS idx_info_pages_how_to_play_multilingual
  ON info_pages USING GIN(how_to_play_steps_multilingual);

-- ============================================================================
-- SECTION 6: info_articles テーブル（スキップ - テーブルが存在しない）
-- ============================================================================

\echo '=== SECTION 6: info_articles テーブル多言語化 ==='
\echo 'Skipped: info_articles table does not exist in this environment'

-- ============================================================================
-- SECTION 7: info_article_blocks テーブル（1カラム追加）
-- ============================================================================

\echo '=== SECTION 7: info_article_blocks テーブル多言語化 ==='

ALTER TABLE info_article_blocks
  ADD COLUMN IF NOT EXISTS data_multilingual JSONB NOT NULL DEFAULT '{"ja":{}}'::jsonb;

UPDATE info_article_blocks
SET data_multilingual = jsonb_build_object('ja', data)
WHERE data_multilingual = '{"ja":{}}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_info_article_blocks_data_multilingual
  ON info_article_blocks USING GIN(data_multilingual);

-- ============================================================================
-- SECTION 8: tournaments テーブル（2カラム追加）
-- ============================================================================

\echo '=== SECTION 8: tournaments テーブル多言語化 ==='

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS benefit_multilingual JSONB DEFAULT '{}'::jsonb;

UPDATE tournaments
SET
  title_multilingual = jsonb_build_object('ja', title),
  benefit_multilingual = jsonb_build_object('ja', COALESCE(benefit, ''))
WHERE title_multilingual = '{"ja":""}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_tournaments_title_multilingual
  ON tournaments USING GIN(title_multilingual);

-- ============================================================================
-- SECTION 9: decks テーブル（2カラム追加）
-- ============================================================================

\echo '=== SECTION 9: decks テーブル多言語化 ==='

ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_multilingual JSONB DEFAULT '{}'::jsonb;

UPDATE decks
SET
  title_multilingual = jsonb_build_object('ja', title),
  description_multilingual = jsonb_build_object('ja', COALESCE(description, ''))
WHERE title_multilingual = '{"ja":""}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_decks_title_multilingual
  ON decks USING GIN(title_multilingual);

-- ============================================================================
-- SECTION 10: trade_posts テーブル（2カラム追加）
-- ============================================================================

\echo '=== SECTION 10: trade_posts テーブル多言語化 ==='

ALTER TABLE trade_posts
  ADD COLUMN IF NOT EXISTS title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS comment_multilingual JSONB DEFAULT '{}'::jsonb;

UPDATE trade_posts
SET
  title_multilingual = jsonb_build_object('ja', title),
  comment_multilingual = jsonb_build_object('ja', COALESCE(comment, ''))
WHERE title_multilingual = '{"ja":""}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_trade_posts_title_multilingual
  ON trade_posts USING GIN(title_multilingual);

-- ============================================================================
-- SECTION 11: user_collages テーブル（2カラム追加）
-- ============================================================================

\echo '=== SECTION 11: user_collages テーブル多言語化 ==='

ALTER TABLE user_collages
  ADD COLUMN IF NOT EXISTS title1_multilingual JSONB NOT NULL DEFAULT '{"ja":"求めるカード"}'::jsonb,
  ADD COLUMN IF NOT EXISTS title2_multilingual JSONB NOT NULL DEFAULT '{"ja":"譲れるカード"}'::jsonb;

UPDATE user_collages
SET
  title1_multilingual = jsonb_build_object('ja', title1),
  title2_multilingual = jsonb_build_object('ja', title2)
WHERE title1_multilingual = '{"ja":"求めるカード"}'::jsonb;

-- ============================================================================
-- SECTION 12: notifications テーブル（1カラム追加）
-- ============================================================================

\echo '=== SECTION 12: notifications テーブル多言語化 ==='

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS payload_multilingual JSONB NOT NULL DEFAULT '{"ja":{}}'::jsonb;

UPDATE notifications
SET payload_multilingual = jsonb_build_object('ja', payload)
WHERE payload_multilingual = '{"ja":{}}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifications_payload_multilingual
  ON notifications USING GIN(payload_multilingual);

-- ============================================================================
-- SECTION 13: 補助テーブルのインデックス作成
-- ============================================================================

\echo '=== SECTION 13: 補助テーブルのインデックス作成 ==='

CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup
  ON translation_cache(source_text, source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_translation_cache_created
  ON translation_cache(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_translation_cache_service
  ON translation_cache(service_used);

CREATE INDEX IF NOT EXISTS idx_translation_jobs_status
  ON translation_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_table_record
  ON translation_jobs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_target_language
  ON translation_jobs(target_language);

-- ============================================================================
-- SECTION 14: RLS ポリシー設定
-- ============================================================================

\echo '=== SECTION 14: RLS ポリシー設定 ==='

ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'translation_cache'
    AND policyname = 'Allow read access to translation cache'
  ) THEN
    CREATE POLICY "Allow read access to translation cache"
      ON translation_cache FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'translation_cache'
    AND policyname = 'Allow authenticated users to manage translation cache'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage translation cache"
      ON translation_cache FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'translation_jobs'
    AND policyname = 'Allow read access to translation jobs'
  ) THEN
    CREATE POLICY "Allow read access to translation jobs"
      ON translation_jobs FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'translation_jobs'
    AND policyname = 'Allow authenticated users to manage translation jobs'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage translation jobs"
      ON translation_jobs FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================================
-- SECTION 15: 統計情報更新
-- ============================================================================

\echo '=== SECTION 15: 統計情報更新 ==='

ANALYZE cards;
ANALYZE packs;
ANALYZE deck_pages;
ANALYZE info_pages;
-- ANALYZE info_articles; -- Skipped: table does not exist
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

\echo '======================================================='
\echo 'Phase 2 マイグレーション完了！'
\echo '======================================================='

-- トランザクション完了
COMMIT;

-- 結果確認
SELECT
  count(*) as multilingual_columns_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name LIKE '%_multilingual';
