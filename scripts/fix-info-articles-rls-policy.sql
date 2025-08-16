-- info_articles テーブルのRLSポリシーを確認・修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Admin can insert articles" ON info_articles;
DROP POLICY IF EXISTS "Admin can update articles" ON info_articles;
DROP POLICY IF EXISTS "Admin can delete articles" ON info_articles;
DROP POLICY IF EXISTS "Anyone can read published articles" ON info_articles;

-- 新しいポリシーを作成
CREATE POLICY "Admin can insert articles" ON info_articles
FOR INSERT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "Admin can update articles" ON info_articles
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "Admin can delete articles" ON info_articles
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "Anyone can read published articles" ON info_articles
FOR SELECT TO anon, authenticated
USING (is_published = true);

-- info_article_blocks テーブルのRLSポリシーも修正
DROP POLICY IF EXISTS "Admin can manage article blocks" ON info_article_blocks;
DROP POLICY IF EXISTS "Anyone can read blocks of published articles" ON info_article_blocks;

CREATE POLICY "Admin can manage article blocks" ON info_article_blocks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
  )
);

CREATE POLICY "Anyone can read blocks of published articles" ON info_article_blocks
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM info_articles 
    WHERE info_articles.id = info_article_blocks.article_id 
    AND info_articles.is_published = true
  )
);
