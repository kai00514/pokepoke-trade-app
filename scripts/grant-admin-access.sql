-- 現在のユーザーに管理者権限を付与（必要に応じて実行）
-- 実際のユーザーIDに置き換えてください

-- 例: 特定のユーザーに管理者権限を付与
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'), 
--   '{is_admin}', 
--   'true'
-- )
-- WHERE email = 'your-admin-email@example.com';

-- または、現在ログインしているユーザーに管理者権限を付与
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'), 
--   '{is_admin}', 
--   'true'
-- )
-- WHERE id = auth.uid();

-- 確認用クエリ
SELECT id, email, raw_user_meta_data->>'is_admin' as is_admin
FROM auth.users
WHERE raw_user_meta_data->>'is_admin' = 'true';
