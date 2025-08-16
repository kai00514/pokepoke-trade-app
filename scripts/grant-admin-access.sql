-- 現在のユーザーに管理者権限を付与
-- 注意: このスクリプトは管理者が実行する必要があります

-- 現在認証されているユーザーのメタデータを更新
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": "true"}'::jsonb
WHERE id = auth.uid();

-- 確認用クエリ（実行後に確認してください）
SELECT 
  id,
  email,
  raw_user_meta_data->>'is_admin' as is_admin
FROM auth.users 
WHERE id = auth.uid();
