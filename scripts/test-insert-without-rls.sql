-- RLS無効化後のテスト挿入
-- 注意: 実際のデータベースで実行する前に、RLSを無効化してください

-- テスト用のINSERT文
INSERT INTO trade_owned_list (user_id, list_name, card_ids) 
VALUES (
    'dba9dfdc-b861-4586-9671-ebb2adae2b90',
    'テストリスト',
    ARRAY[1538, 1539, 1540, 1541, 1542]
);

-- 挿入されたデータの確認
SELECT * FROM trade_owned_list 
WHERE user_id = 'dba9dfdc-b861-4586-9671-ebb2adae2b90';

-- テストデータの削除（必要に応じて）
-- DELETE FROM trade_owned_list WHERE list_name = 'テストリスト';
