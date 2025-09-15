-- Drop existing single card ID columns
ALTER TABLE trade_posts 
DROP COLUMN IF EXISTS wanted_card_id,
DROP COLUMN IF EXISTS offered_card_id,
DROP COLUMN IF EXISTS want_card_id;

-- Add new JSONB columns for multiple cards support
ALTER TABLE trade_posts 
ADD COLUMN wanted_card_id JSONB DEFAULT '[]'::jsonb,
ADD COLUMN offered_card_id JSONB DEFAULT '[]'::jsonb;

-- Add constraints to ensure valid JSON structure
ALTER TABLE trade_posts 
ADD CONSTRAINT check_wanted_card_id_is_array 
CHECK (jsonb_typeof(wanted_card_id) = 'array'),
ADD CONSTRAINT check_offered_card_id_is_array 
CHECK (jsonb_typeof(offered_card_id) = 'array');

-- Create indexes for better query performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_trade_posts_wanted_card_id_gin 
ON trade_posts USING gin (wanted_card_id);

CREATE INDEX IF NOT EXISTS idx_trade_posts_offered_card_id_gin 
ON trade_posts USING gin (offered_card_id);

-- Add comments for documentation
COMMENT ON COLUMN trade_posts.wanted_card_id IS 'JSONB array of wanted card objects with id, name, imageUrl';
COMMENT ON COLUMN trade_posts.offered_card_id IS 'JSONB array of offered card objects with id, name, imageUrl';
