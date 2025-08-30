-- 指定されたユーザーIDの存在確認
SELECT id, email, created_at 
FROM public.users 
WHERE id = 'dba9dfdc-b861-4586-9671-ebb2adae2b90';

-- 全ユーザー数確認
SELECT COUNT(*) as total_users FROM public.users;

-- 全ユーザー一覧（最新5件）
SELECT id, email, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
