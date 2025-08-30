-- 必要なトリガー関数の存在確認
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('check_max_lists_per_user', 'update_trade_owned_list_updated_at');

-- 関数の詳細情報確認
SELECT 
    p.proname AS function_name,
    p.prokind AS function_type,
    p.proargnames AS argument_names,
    t.typname AS return_type
FROM pg_proc p
JOIN pg_type t ON p.prorettype = t.oid
WHERE p.proname IN ('check_max_lists_per_user', 'update_trade_owned_list_updated_at')
AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
