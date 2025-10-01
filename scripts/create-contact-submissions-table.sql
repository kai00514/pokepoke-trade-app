-- contact_submissions テーブルを作成
CREATE TABLE IF NOT EXISTS contact_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id ON contact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- RLSを有効化
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ポリシーを作成: 誰でも挿入可能
CREATE POLICY "Anyone can insert contact submissions" ON contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- ポリシーを作成: 自分の送信のみ閲覧可能
CREATE POLICY "Users can view their own submissions" ON contact_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシーを作成: 管理者は全て閲覧可能
CREATE POLICY "Admins can view all submissions" ON contact_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- updated_at の自動更新トリガー
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- コメント追加
COMMENT ON TABLE contact_submissions IS 'お問い合わせフォームの送信データ';
COMMENT ON COLUMN contact_submissions.user_id IS '送信したユーザーのID（ログインしていない場合はNULL）';
COMMENT ON COLUMN contact_submissions.name IS '送信者の名前';
COMMENT ON COLUMN contact_submissions.email IS '送信者のメールアドレス';
COMMENT ON COLUMN contact_submissions.subject IS 'お問い合わせの件名';
COMMENT ON COLUMN contact_submissions.message IS 'お問い合わせのメッセージ';
COMMENT ON COLUMN contact_submissions.status IS 'ステータス（pending, in_progress, resolved）';
