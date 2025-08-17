-- deck_pagesテーブルが存在しない場合に作成
CREATE TABLE IF NOT EXISTS deck_pages (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    deck_name TEXT NOT NULL,
    deck_description TEXT,
    deck_badge TEXT,
    thumbnail_image_url TEXT,
    thumbnail_alt TEXT,
    section1_title TEXT,
    section2_title TEXT,
    section3_title TEXT,
    category TEXT NOT NULL,
    energy_type TEXT,
    evaluation_title TEXT,
    tier_rank TEXT NOT NULL,
    tier_name TEXT,
    tier_descriptions JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT false,
    stat_accessibility INTEGER DEFAULT 0,
    stat_speed INTEGER DEFAULT 0,
    stat_power INTEGER DEFAULT 0,
    stat_durability INTEGER DEFAULT 0,
    stat_stability INTEGER DEFAULT 0,
    strengths_weaknesses_list JSONB DEFAULT '[]'::jsonb,
    how_to_play_list JSONB DEFAULT '[]'::jsonb,
    deck_cards JSONB DEFAULT '{}'::jsonb,
    strengths_weaknesses JSONB DEFAULT '[]'::jsonb,
    how_to_play_steps JSONB DEFAULT '[]'::jsonb,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_deck_pages_category ON deck_pages(category);
CREATE INDEX IF NOT EXISTS idx_deck_pages_tier_rank ON deck_pages(tier_rank);
CREATE INDEX IF NOT EXISTS idx_deck_pages_is_published ON deck_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_deck_pages_created_at ON deck_pages(created_at DESC);

-- RLSポリシーを有効化
ALTER TABLE deck_pages ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY IF NOT EXISTS "deck_pages_select_policy" ON deck_pages
    FOR SELECT USING (true);

-- 認証されたユーザーが挿入可能
CREATE POLICY IF NOT EXISTS "deck_pages_insert_policy" ON deck_pages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 認証されたユーザーが更新可能
CREATE POLICY IF NOT EXISTS "deck_pages_update_policy" ON deck_pages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 認証されたユーザーが削除可能
CREATE POLICY IF NOT EXISTS "deck_pages_delete_policy" ON deck_pages
    FOR DELETE USING (auth.role() = 'authenticated');
