-- お問い合わせテーブルの作成
CREATE TABLE IF NOT EXISTS contact_submissions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id ON contact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- RLSポリシーの設定
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の投稿のみ閲覧可能
CREATE POLICY "Users can view their own contact submissions" ON contact_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分の投稿を作成可能
CREATE POLICY "Users can create their own contact submissions" ON contact_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 管理者は全ての投稿を閲覧・更新可能
CREATE POLICY "Admins can view all contact submissions" ON contact_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can update all contact submissions" ON contact_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- 管理者権限でのデータ削除も可能
CREATE POLICY "Admins can delete contact submissions" ON contact_submissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- コメント追加
COMMENT ON TABLE contact_submissions IS 'ユーザーからのお問い合わせを管理するテーブル';
COMMENT ON COLUMN contact_submissions.name IS 'お問い合わせ者の名前';
COMMENT ON COLUMN contact_submissions.email IS 'お問い合わせ者のメールアドレス';
COMMENT ON COLUMN contact_submissions.subject IS 'お問い合わせの件名';
COMMENT ON COLUMN contact_submissions.message IS 'お問い合わせの内容';
COMMENT ON COLUMN contact_submissions.user_id IS '認証済みユーザーの場合のユーザーID';
COMMENT ON COLUMN contact_submissions.status IS 'お問い合わせの処理状況';
COMMENT ON COLUMN contact_submissions.admin_notes IS '管理者用のメモ';
