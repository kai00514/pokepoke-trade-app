-- info_articlesテーブルのスキーマとデータを移行

-- まず既存のテーブルを削除（存在する場合）
DROP TABLE IF EXISTS public.info_articles CASCADE;

-- info_articlesテーブルを作成
CREATE TABLE public.info_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content JSONB NOT NULL,
  category TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}'::TEXT[]
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_info_articles_slug ON public.info_articles(slug);
CREATE INDEX IF NOT EXISTS idx_info_articles_category ON public.info_articles(category);
CREATE INDEX IF NOT EXISTS idx_info_articles_published_at ON public.info_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_info_articles_is_published ON public.info_articles(is_published);

-- RLSポリシーを有効化
ALTER TABLE public.info_articles ENABLE ROW LEVEL SECURITY;

-- 読み取りポリシー（公開済み記事は誰でも読める）
CREATE POLICY "Anyone can read published articles"
  ON public.info_articles
  FOR SELECT
  USING (is_published = true);

-- 管理者による全操作許可（service_roleキーを使用）
CREATE POLICY "Service role can do anything"
  ON public.info_articles
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

-- サンプルデータを挿入（必要に応じて）
-- INSERT INTO public.info_articles (title, slug, content, category, is_published, published_at)
-- VALUES
--   ('サンプル記事', 'sample-article', '{"blocks": [{"type": "paragraph", "data": {"text": "サンプルコンテンツ"}}]}'::jsonb, 'news', true, NOW());
