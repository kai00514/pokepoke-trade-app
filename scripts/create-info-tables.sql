-- info_articlesテーブルとinfo_article_blocksテーブルを作成

-- 既存のテーブルを削除（存在する場合）
DROP TABLE IF EXISTS public.info_article_blocks CASCADE;
DROP TABLE IF EXISTS public.info_articles CASCADE;

-- info_articlesテーブルを作成
CREATE TABLE public.info_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  thumbnail_image_url TEXT,
  category TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pinned BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}'::TEXT[]
);

-- info_article_blocksテーブルを作成
CREATE TABLE public.info_article_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.info_articles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_info_articles_published_at ON public.info_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_info_articles_category ON public.info_articles(category);
CREATE INDEX IF NOT EXISTS idx_info_articles_slug ON public.info_articles(slug);
CREATE INDEX IF NOT EXISTS idx_info_articles_pinned_priority ON public.info_articles(pinned DESC, priority DESC, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_info_article_blocks_article_id ON public.info_article_blocks(article_id);
CREATE INDEX IF NOT EXISTS idx_info_article_blocks_display_order ON public.info_article_blocks(article_id, display_order);

-- RLSポリシーを有効化
ALTER TABLE public.info_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_article_blocks ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能
CREATE POLICY "Anyone can read info_articles"
  ON public.info_articles
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read info_article_blocks"
  ON public.info_article_blocks
  FOR SELECT
  USING (true);

-- Service role は全操作可能
CREATE POLICY "Service role can do anything on info_articles"
  ON public.info_articles
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything on info_article_blocks"
  ON public.info_article_blocks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
CREATE TRIGGER update_info_articles_updated_at
  BEFORE UPDATE ON public.info_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータを挿入
DO $$
DECLARE
  article_id UUID;
BEGIN
  -- サンプル記事を作成
  INSERT INTO public.info_articles (title, slug, excerpt, category, published_at, pinned, priority)
  VALUES
    ('ポケリンクへようこそ！', 'welcome', 'ポケリンクはポケモンカードのトレード掲示板です', 'news', NOW(), true, 100)
  RETURNING id INTO article_id;

  -- サンプルブロックを追加
  INSERT INTO public.info_article_blocks (article_id, type, display_order, data)
  VALUES
    (article_id, 'heading', 0, '{"level": 1, "text": "ポケリンクへようこそ！"}'::jsonb),
    (article_id, 'paragraph', 1, '{"text": "ポケリンクは、ポケモンカードのトレーディングを楽しむための掲示板サービスです。"}'::jsonb),
    (article_id, 'paragraph', 2, '{"text": "カードの交換、デッキ作成、マッチングなど、様々な機能をお楽しみください。"}'::jsonb);
END $$;
