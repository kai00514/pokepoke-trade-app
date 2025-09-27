-- Create tournaments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tournaments (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  event_date timestamp NOT NULL,
  is_online boolean DEFAULT true,
  benefit text DEFAULT '',
  detail_url text DEFAULT '',
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert sample data for testing
INSERT INTO public.tournaments (title, event_date, is_online, benefit, detail_url, is_published) VALUES
('ポケモンカード大会 東京予選', '2025-01-30 14:00:00', false, '限定プロモカード', 'https://example.com/tournament/1', true),
('新春杯トーナメント', '2025-02-05 10:00:00', false, '優勝賞金5万円', 'https://example.com/tournament/2', true),
('オンライン大会 冬の陣', '2025-02-10 19:00:00', true, 'デジタル限定カード', 'https://example.com/tournament/3', true),
('チャンピオンズリーグ予選', '2025-02-15 13:00:00', false, '世界大会出場権', 'https://example.com/tournament/4', true),
('学生限定オンライン大会', '2025-02-20 16:00:00', true, '図書カード1万円分', 'https://example.com/tournament/5', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to published tournaments" ON public.tournaments
  FOR SELECT USING (is_published = true);

-- Create policy for authenticated users to manage tournaments (for admin)
CREATE POLICY "Allow authenticated users to manage tournaments" ON public.tournaments
  FOR ALL USING (auth.role() = 'authenticated');
