-- お問い合わせテーブルの作成
CREATE TABLE IF NOT EXISTS contact_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id ON contact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- RLSポリシーの有効化
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の投稿のみ閲覧可能
CREATE POLICY "Users can view own submissions" ON contact_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の投稿を作成可能
CREATE POLICY "Users can create own submissions" ON contact_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 管理者は全ての投稿を閲覧・更新可能
CREATE POLICY "Admins can view all submissions" ON contact_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- コメント
COMMENT ON TABLE contact_submissions IS 'ユーザーからのお問い合わせ投稿';
COMMENT ON COLUMN contact_submissions.status IS 'お問い合わせの処理状況';
COMMENT ON COLUMN contact_submissions.admin_notes IS '管理者用メモ';
