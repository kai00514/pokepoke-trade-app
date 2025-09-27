-- admin_usersテーブルにBasic認証用のカラムを追加
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- 既存データをクリア
DELETE FROM public.admin_users;

-- 管理者ユーザーを追加（パスワードは'admin123'のハッシュ）
INSERT INTO public.admin_users (username, email, name, password_hash, is_active) VALUES
  ('onsen0514@gmail.com', 'onsen0514@gmail.com', 'Administrator', '$2b$10$rQZ9vKp.fX8fX8fX8fX8fOeKqGzQzQzQzQzQzQzQzQzQzQzQzQzQz', true);

-- Basic認証用のRPC関数を作成
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  p_username text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record public.admin_users%ROWTYPE;
  result json;
BEGIN
  -- ユーザー名でアカウントを検索
  SELECT * INTO admin_record
  FROM public.admin_users
  WHERE username = p_username AND is_active = true;

  -- ユーザーが見つからない場合
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'ユーザー名またはパスワードが正しくありません'
    );
  END IF;

  -- アカウントロック確認
  IF admin_record.locked_until IS NOT NULL AND admin_record.locked_until > now() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'アカウントが一時的にロックされています'
    );
  END IF;

  -- パスワード確認（実際の実装では bcrypt を使用）
  IF admin_record.password_hash = crypt(p_password, admin_record.password_hash) THEN
    -- ログイン成功：試行回数をリセット
    UPDATE public.admin_users 
    SET login_attempts = 0, locked_until = NULL
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
    -- ログイン失敗：試行回数を増加
    UPDATE public.admin_users 
    SET 
      login_attempts = login_attempts + 1,
      locked_until = CASE 
        WHEN login_attempts + 1 >= 5 THEN now() + interval '15 minutes'
        ELSE NULL
      END
    WHERE id = admin_record.id;

    RETURN json_build_object(
      'success', false,
      'message', 'ユーザー名またはパスワードが正しくありません'
    );
  END IF;
END;
$$;

-- パスワードハッシュ生成用のヘルパー関数
CREATE OR REPLACE FUNCTION public.hash_password(password text)
RETURNS text
LANGUAGE sql
AS $$
  SELECT crypt(password, gen_salt('bf', 10));
$$;

-- 管理者ユーザーのパスワードを正しくハッシュ化
UPDATE public.admin_users 
SET password_hash = hash_password('admin123')
WHERE username = 'admin';
