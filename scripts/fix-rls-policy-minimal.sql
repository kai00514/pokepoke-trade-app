-- 現在の問題のあるRLSポリシーを削除
DROP POLICY IF EXISTS "Users manage their own lists" ON trade_owned_list;

-- 最小限の修正: すべてのアクセスを許可するポリシーを作成
CREATE POLICY "Allow all access" ON trade_owned_list
    FOR ALL USING (true);

-- または、RLSを完全に無効化する場合（より確実）
ALTER TABLE trade_owned_list DISABLE ROW LEVEL SECURITY;
