-- 新しいブロックタイプを許可するためのCHECK制約を更新
ALTER TABLE info_article_blocks 
DROP CONSTRAINT IF EXISTS info_blocks_type_allowed;

-- 新しいブロックタイプを含む制約を追加
ALTER TABLE info_article_blocks 
ADD CONSTRAINT info_blocks_type_allowed 
CHECK (type IN (
  'heading',
  'paragraph', 
  'image',
  'list',
  'table',
  'callout',
  'divider',
  'toc',
  'related-links',
  'evaluation',
  'cards-table',
  'pickup',
  'button',
  'card-display-table',
  'flexible-table',
  'rich-text',
  'media-gallery'
));

-- インデックスも更新
CREATE INDEX IF NOT EXISTS info_article_blocks_type_idx ON info_article_blocks (type);
