-- 管理者ユーザーテーブルの作成
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS有効化
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能なポリシー
CREATE POLICY "Admin users can view admin_users" ON public.admin_users
  FOR SELECT USING (auth.email() IN (
    SELECT email FROM public.admin_users WHERE is_active = true
  ));

-- 初期管理者ユーザーを追加（実際のメールアドレスに変更してください）
INSERT INTO public.admin_users (email, name, is_active) VALUES
  ('admin@example.com', 'Admin User', true)
ON CONFLICT (email) DO NOTHING;

-- 管理者チェック用のRPC関数
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email AND is_active = true
  );
$$;
