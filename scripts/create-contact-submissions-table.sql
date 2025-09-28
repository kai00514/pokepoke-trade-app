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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id ON contact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- RLSポリシーの設定
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のお問い合わせのみ閲覧可能
CREATE POLICY "Users can view their own submissions" ON contact_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のお問い合わせを作成可能
CREATE POLICY "Users can create their own submissions" ON contact_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 管理者は全てのお問い合わせを閲覧・管理可能
CREATE POLICY "Admins can view all submissions" ON contact_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
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
COMMENT ON TABLE contact_submissions IS 'ユーザーからのお問い合わせを管理するテーブル';
COMMENT ON COLUMN contact_submissions.status IS 'お問い合わせの処理状況 (pending: 未対応, in_progress: 対応中, resolved: 解決済み, closed: 終了)';
