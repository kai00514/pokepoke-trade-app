-- 新しいブロックタイプを許可するためにCHECK制約を更新（既存のもののみ）
ALTER TABLE info_article_blocks 
DROP CONSTRAINT IF EXISTS info_blocks_type_allowed;

ALTER TABLE info_article_blocks 
ADD CONSTRAINT info_blocks_type_allowed 
CHECK (type IN (
  'heading',
  'paragraph', 
  'rich-text',
  'image',
  'list',
  'table',
  'flexible-table',
  'callout',
  'cards-table',
  'card-display-table',
  'media-gallery',
  'pickup',
  'button',
  'toc',
  'evaluation',
  'related-links',
  'divider'
));
