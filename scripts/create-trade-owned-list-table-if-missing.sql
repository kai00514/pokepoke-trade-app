-- trade_owned_listテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS trade_owned_list (
    id SERIAL PRIMARY KEY,
    list_name TEXT NOT NULL,
    card_ids INTEGER[] DEFAULT '{}',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE trade_owned_list ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のリストのみアクセス可能
DROP POLICY IF EXISTS "Users can manage their own trade owned lists" ON trade_owned_list;
CREATE POLICY "Users can manage their own trade owned lists" ON trade_owned_list
    FOR ALL USING (auth.uid() = user_id);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_trade_owned_list_user_id ON trade_owned_list(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_owned_list_updated_at ON trade_owned_list(updated_at);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_trade_owned_list_updated_at ON trade_owned_list;
CREATE TRIGGER update_trade_owned_list_updated_at
    BEFORE UPDATE ON trade_owned_list
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
