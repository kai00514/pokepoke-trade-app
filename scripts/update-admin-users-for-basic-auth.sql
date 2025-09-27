-- 管理者テーブルにBasic認証用のカラムを追加
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- 既存のRPC関数を削除
DROP FUNCTION IF EXISTS public.is_admin_user(text);

-- パスワードハッシュ化関数
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;

-- 管理者認証関数
CREATE OR REPLACE FUNCTION public.authenticate_admin(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record record;
  is_locked boolean := false;
BEGIN
  -- ユーザー情報を取得
  SELECT * INTO admin_record 
  FROM public.admin_users 
  WHERE username = p_username AND is_active = true;

  -- ユーザーが存在しない場合
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invalid_credentials');
  END IF;

  -- アカウントロック確認
  IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > now() THEN
    RETURN json_build_object('success', false, 'error', 'account_locked');
  END IF;

  -- パスワード確認
  IF admin_record.password_hash = crypt(p_password, admin_record.password_hash) THEN
    -- ログイン成功：失敗回数とロックをリセット
    UPDATE public.admin_users 
    SET failed_attempts = 0, locked_until = NULL 
    WHERE id = admin_record.id;

    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'id', admin_record.id,
        'username', admin_record.username,
        'email', admin_record.email,
        'name', admin_record.name
      )
    );
  ELSE
    -- ログイン失敗：失敗回数を増加
    UPDATE public.admin_users 
    SET 
      failed_attempts = failed_attempts + 1,
      locked_until = CASE 
        WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes'
        ELSE locked_until
      END
    WHERE id = admin_record.id;

    RETURN json_build_object('success', false, 'error', 'invalid_credentials');
  END IF;
END;
$$;

-- デフォルト管理者を作成（既存データをクリア）
DELETE FROM public.admin_users;

INSERT INTO public.admin_users (username, email, name, password_hash, is_active) VALUES
  ('admin', 'admin@pokelnk.com', 'Administrator', hash_password('admin123'), true);

-- RLS ポリシーを更新
DROP POLICY IF EXISTS "Admin users are viewable by everyone" ON public.admin_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admin_users;

-- 管理者テーブルへの読み取りアクセスを許可（認証用）
CREATE POLICY "Enable read access for authentication" ON public.admin_users
  FOR SELECT USING (true);
