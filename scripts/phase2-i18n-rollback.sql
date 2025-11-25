-- ============================================================================
-- Phase 2: 多言語対応ロールバックSQL
-- 作成日: 2025-11-25
-- 目的: マイグレーションを元に戻す（緊急時のみ使用）
-- 警告: このスクリプトは多言語カラムとデータを削除します！
-- ============================================================================

-- トランザクション開始
BEGIN;

RAISE NOTICE '=======================================================';
RAISE NOTICE '警告: Phase 2マイグレーションをロールバックします';
RAISE NOTICE 'すべての多言語データが削除されます！';
RAISE NOTICE '=======================================================';

-- ============================================================================
-- SECTION 1: インデックス削除
-- ============================================================================

RAISE NOTICE '=== SECTION 1: インデックス削除 ===';

-- cards
DROP INDEX IF EXISTS idx_cards_name_multilingual;
DROP INDEX IF EXISTS idx_cards_image_url_multilingual;

-- packs
DROP INDEX IF EXISTS idx_packs_name_multilingual;

-- deck_pages
DROP INDEX IF EXISTS idx_deck_pages_title_multilingual;
DROP INDEX IF EXISTS idx_deck_pages_deck_name_multilingual;
DROP INDEX IF EXISTS idx_deck_pages_strengths_weaknesses_multilingual;
DROP INDEX IF EXISTS idx_deck_pages_how_to_play_multilingual;

-- info_pages
DROP INDEX IF EXISTS idx_info_pages_title_multilingual;
DROP INDEX IF EXISTS idx_info_pages_deck_name_multilingual;
DROP INDEX IF EXISTS idx_info_pages_strengths_weaknesses_multilingual;
DROP INDEX IF EXISTS idx_info_pages_how_to_play_multilingual;

-- info_articles
DROP INDEX IF EXISTS idx_info_articles_title_multilingual;
DROP INDEX IF EXISTS idx_info_articles_tags_multilingual;

-- info_article_blocks
DROP INDEX IF EXISTS idx_info_article_blocks_data_multilingual;

-- tournaments
DROP INDEX IF EXISTS idx_tournaments_title_multilingual;

-- decks
DROP INDEX IF EXISTS idx_decks_title_multilingual;

-- trade_posts
DROP INDEX IF EXISTS idx_trade_posts_title_multilingual;

-- notifications
DROP INDEX IF EXISTS idx_notifications_payload_multilingual;

-- translation_cache
DROP INDEX IF EXISTS idx_translation_cache_lookup;
DROP INDEX IF EXISTS idx_translation_cache_created;
DROP INDEX IF EXISTS idx_translation_cache_service;

-- translation_jobs
DROP INDEX IF EXISTS idx_translation_jobs_status;
DROP INDEX IF EXISTS idx_translation_jobs_table_record;
DROP INDEX IF EXISTS idx_translation_jobs_target_language;

-- ============================================================================
-- SECTION 2: カラム削除
-- ============================================================================

RAISE NOTICE '=== SECTION 2: カラム削除 ===';

-- cards
ALTER TABLE cards
  DROP COLUMN IF EXISTS name_multilingual,
  DROP COLUMN IF EXISTS image_url_multilingual;

-- packs
ALTER TABLE packs
  DROP COLUMN IF EXISTS name_multilingual,
  DROP COLUMN IF EXISTS symbol_url_multilingual;

-- deck_pages
ALTER TABLE deck_pages
  DROP COLUMN IF EXISTS title_multilingual,
  DROP COLUMN IF EXISTS deck_name_multilingual,
  DROP COLUMN IF EXISTS deck_description_multilingual,
  DROP COLUMN IF EXISTS evaluation_title_multilingual,
  DROP COLUMN IF EXISTS tier_name_multilingual,
  DROP COLUMN IF EXISTS tier_descriptions_multilingual,
  DROP COLUMN IF EXISTS section1_title_multilingual,
  DROP COLUMN IF EXISTS section2_title_multilingual,
  DROP COLUMN IF EXISTS section3_title_multilingual,
  DROP COLUMN IF EXISTS strengths_weaknesses_list_multilingual,
  DROP COLUMN IF EXISTS strengths_weaknesses_details_multilingual,
  DROP COLUMN IF EXISTS how_to_play_list_multilingual,
  DROP COLUMN IF EXISTS how_to_play_steps_multilingual,
  DROP COLUMN IF EXISTS thumbnail_alt_multilingual,
  DROP COLUMN IF EXISTS deck_badge_multilingual,
  DROP COLUMN IF EXISTS thumbnail_image_url_multilingual,
  DROP COLUMN IF EXISTS energy_image_url_multilingual;

-- info_pages
ALTER TABLE info_pages
  DROP COLUMN IF EXISTS title_multilingual,
  DROP COLUMN IF EXISTS deck_name_multilingual,
  DROP COLUMN IF EXISTS deck_description_multilingual,
  DROP COLUMN IF EXISTS evaluation_title_multilingual,
  DROP COLUMN IF EXISTS tier_name_multilingual,
  DROP COLUMN IF EXISTS tier_descriptions_multilingual,
  DROP COLUMN IF EXISTS section1_title_multilingual,
  DROP COLUMN IF EXISTS section2_title_multilingual,
  DROP COLUMN IF EXISTS section3_title_multilingual,
  DROP COLUMN IF EXISTS strengths_weaknesses_list_multilingual,
  DROP COLUMN IF EXISTS strengths_weaknesses_details_multilingual,
  DROP COLUMN IF EXISTS how_to_play_list_multilingual,
  DROP COLUMN IF EXISTS how_to_play_steps_multilingual,
  DROP COLUMN IF EXISTS thumbnail_alt_multilingual,
  DROP COLUMN IF EXISTS deck_badge_multilingual,
  DROP COLUMN IF EXISTS thumbnail_image_url_multilingual,
  DROP COLUMN IF EXISTS energy_image_url_multilingual;

-- info_articles
ALTER TABLE info_articles
  DROP COLUMN IF EXISTS title_multilingual,
  DROP COLUMN IF EXISTS subtitle_multilingual,
  DROP COLUMN IF EXISTS excerpt_multilingual,
  DROP COLUMN IF EXISTS thumbnail_image_url_multilingual,
  DROP COLUMN IF EXISTS hero_image_url_multilingual,
  DROP COLUMN IF EXISTS tags_multilingual;

-- info_article_blocks
ALTER TABLE info_article_blocks
  DROP COLUMN IF EXISTS data_multilingual;

-- tournaments
ALTER TABLE tournaments
  DROP COLUMN IF EXISTS title_multilingual,
  DROP COLUMN IF EXISTS benefit_multilingual;

-- decks
ALTER TABLE decks
  DROP COLUMN IF EXISTS title_multilingual,
  DROP COLUMN IF EXISTS description_multilingual;

-- trade_posts
ALTER TABLE trade_posts
  DROP COLUMN IF EXISTS title_multilingual,
  DROP COLUMN IF EXISTS comment_multilingual;

-- user_collages
ALTER TABLE user_collages
  DROP COLUMN IF EXISTS title1_multilingual,
  DROP COLUMN IF EXISTS title2_multilingual;

-- notifications
ALTER TABLE notifications
  DROP COLUMN IF EXISTS payload_multilingual;

-- ============================================================================
-- SECTION 3: 補助テーブル削除
-- ============================================================================

RAISE NOTICE '=== SECTION 3: 補助テーブル削除 ===';

DROP TABLE IF EXISTS translation_jobs CASCADE;
DROP TABLE IF EXISTS translation_cache CASCADE;

-- ============================================================================
-- 完了
-- ============================================================================

RAISE NOTICE '=======================================================';
RAISE NOTICE 'Phase 2 ロールバック完了';
RAISE NOTICE 'すべての多言語カラムとテーブルが削除されました';
RAISE NOTICE '=======================================================';

-- トランザクション完了
COMMIT;
