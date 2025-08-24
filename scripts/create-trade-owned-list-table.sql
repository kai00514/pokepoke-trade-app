-- Create trade_owned_list table for storing user's tradeable card lists
CREATE TABLE IF NOT EXISTS trade_owned_list (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    list_name VARCHAR(100) NOT NULL,
    card_ids INTEGER[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints based on specifications
    CONSTRAINT check_card_ids_limit CHECK (array_length(card_ids, 1) <= 35),
    CONSTRAINT check_list_name_not_empty CHECK (length(trim(list_name)) > 0)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_trade_owned_list_user_id ON trade_owned_list(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE trade_owned_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own lists" ON trade_owned_list
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to check max 10 lists per user
CREATE OR REPLACE FUNCTION check_max_lists_per_user()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM trade_owned_list WHERE user_id = NEW.user_id) >= 10 THEN
        RAISE EXCEPTION 'Maximum 10 lists allowed per user';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_max_lists
    BEFORE INSERT ON trade_owned_list
    FOR EACH ROW
    EXECUTE FUNCTION check_max_lists_per_user();

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trade_owned_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trade_owned_list_updated_at
    BEFORE UPDATE ON trade_owned_list
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_owned_list_updated_at();
