-- 現在のRLSポリシーを削除
DROP POLICY IF EXISTS "Users manage their own lists" ON trade_owned_list;

-- public.usersテーブル用の新しいRLSポリシーを作成
-- 注意: この方法はセキュリティ上の問題があるため、適切な認証方法を実装する必要があります

-- 方法1: 一時的にRLSを無効化（開発・テスト用）
ALTER TABLE trade_owned_list DISABLE ROW LEVEL SECURITY;

-- 方法2: より安全なポリシー（推奨）
-- まず、現在のユーザーを識別する関数を作成
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    -- この関数は実際の認証システムに合わせて実装する必要があります
    -- 例: JWTトークンから取得、セッションから取得など
    RETURN NULL; -- 実装が必要
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新しいポリシーを作成（実装後に有効化）
-- CREATE POLICY "Users manage their own lists" ON trade_owned_list
--     FOR ALL USING (get_current_user_id() = user_id);

-- 方法3: 管理者権限でのアクセス許可（一時的）
CREATE POLICY "Allow all for development" ON trade_owned_list
    FOR ALL USING (true);
