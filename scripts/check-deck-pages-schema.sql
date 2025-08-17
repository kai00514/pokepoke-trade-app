-- deck_pagesテーブルの構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'deck_pages' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- テーブルが存在するかも確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'deck_pages'
) as table_exists;
