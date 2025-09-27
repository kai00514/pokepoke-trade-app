-- admin_usersテーブルのRLS設定を修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;

-- RLSを一時的に無効化（管理者認証用）
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- または、匿名ユーザーでも認証時のみアクセス可能なポリシーを作成
-- ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow authentication access" ON public.admin_users
--   FOR SELECT USING (true);

-- 認証用のRPC関数も更新
CREATE OR REPLACE FUNCTION public.authenticate_admin_user(
  input_username text,
  input_password text
)
RETURNS TABLE(
  id uuid,
  username text,
  email text,
  name text,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.username,
    u.email,
    u.name,
    u.is_active
  FROM public.admin_users u
  WHERE u.username = input_username 
    AND u.password_hash = input_password 
    AND u.is_active = true;
$$;
