-- 1. public.usersテーブルの存在確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) AS users_table_exists;

-- 2. public.usersテーブルの構造確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
ORDER BY ordinal_position;

-- 3. トリガー関数の存在確認
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_max_lists_per_user', 'update_trade_owned_list_updated_at');

-- 4. トリガーの状態確認
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'trade_owned_list';

-- 5. RLSポリシーの確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'trade_owned_list';

-- 6. テーブルのRLS有効状態確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'trade_owned_list';

-- 7. 外部キー制約の詳細確認
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'trade_owned_list';

-- 8. 現在のユーザーの権限確認
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'trade_owned_list'
AND grantee = current_user;

-- 9. テーブルの制約確認
SELECT
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'trade_owned_list'
ORDER BY tc.constraint_type;

-- 10. 実際のデータ挿入テスト（エラーメッセージ確認用）
-- 注意: このクエリは実際には実行しないでください。エラーメッセージを確認するためのものです。
/*
INSERT INTO trade_owned_list (user_id, list_name, card_ids) 
VALUES (
    'dba9dfdc-b861-4586-9671-ebb2adae2b90',
    'testtest',
    ARRAY[1538, 1539, 1540, 1541, 1542]
);
*/
