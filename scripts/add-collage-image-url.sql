-- Add collage_image_url column to user_collages table
ALTER TABLE user_collages 
ADD COLUMN IF NOT EXISTS collage_image_url TEXT;

-- Add collage_storage_path for deletion management
ALTER TABLE user_collages 
ADD COLUMN IF NOT EXISTS collage_storage_path TEXT;

COMMENT ON COLUMN user_collages.collage_image_url IS 'Supabase Storage公開URL (1536x1024px)';
COMMENT ON COLUMN user_collages.collage_storage_path IS 'Supabase Storage内のファイルパス (削除用)';
