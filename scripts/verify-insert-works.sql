-- 直接INSERT文のテスト（これは成功している）
INSERT INTO trade_owned_list (user_id, list_name, card_ids) 
VALUES ('dba9dfdc-b861-4586-9671-ebb2adae2b90', 'テストリスト', ARRAY[1538, 1539, 1540]);

-- 挿入されたデータの確認
SELECT * FROM trade_owned_list WHERE user_id = 'dba9dfdc-b861-4586-9671-ebb2adae2b90' ORDER BY created_at DESC LIMIT 5;

-- RLSポリシーの現在の状態を確認
SELECT schemaname, tablename, policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'trade_owned_list';

-- テーブルのRLS状態を確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'trade_owned_list';
