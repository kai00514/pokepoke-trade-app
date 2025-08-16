-- info_articles テーブルのRLSポリシーを一時的に緩和（誰でもアクセス可能）

-- 現在のRLS状態を確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('info_articles', 'info_article_blocks');

-- 現在のポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('info_articles', 'info_article_blocks');

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Admin can insert articles" ON info_articles;
DROP POLICY IF EXISTS "Admin can update articles" ON info_articles;
DROP POLICY IF EXISTS "Admin can delete articles" ON info_articles;
DROP POLICY IF EXISTS "Admin can read all articles" ON info_articles;
DROP POLICY IF EXISTS "Anyone can read published articles" ON info_articles;

-- 一時的に緩和されたポリシーを作成（認証されたユーザーなら誰でも可能）
CREATE POLICY "Authenticated users can manage articles" ON info_articles
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 認証されたユーザーが記事を作成・更新・削除できるポリシーを追加
CREATE POLICY "authenticated_users_can_manage_articles" ON info_articles
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 未認証ユーザーは公開記事のみ読める
CREATE POLICY "Anyone can read published articles" ON info_articles
FOR SELECT TO anon
USING (is_published = true);

-- info_article_blocks テーブルのRLSポリシーも緩和
DROP POLICY IF EXISTS "Admin can manage article blocks" ON info_article_blocks;
DROP POLICY IF EXISTS "Anyone can read blocks of published articles" ON info_article_blocks;

-- 認証されたユーザーは全てのブロックを管理可能
CREATE POLICY "Authenticated users can manage article blocks" ON info_article_blocks
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 認証されたユーザーが記事ブロックを作成・更新・削除できるポリシーを追加
CREATE POLICY "authenticated_users_can_manage_blocks" ON info_article_blocks
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 未認証ユーザーは公開記事のブロックのみ読める
CREATE POLICY "Anyone can read blocks of published articles" ON info_article_blocks
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM info_articles 
    WHERE info_articles.id = info_article_blocks.article_id 
    AND info_articles.is_published = true
  )
);
