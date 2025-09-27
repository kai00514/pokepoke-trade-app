-- 新しいブロックタイプを許可するためにCHECK制約を更新
ALTER TABLE info_article_blocks 
DROP CONSTRAINT IF EXISTS info_blocks_type_allowed;

ALTER TABLE info_article_blocks 
ADD CONSTRAINT info_blocks_type_allowed 
CHECK (type IN (
  'heading',
  'paragraph', 
  'image',
  'list',
  'table',
  'callout',
  'cards-table',
  'pickup',
  'button',
  'toc',
  'evaluation',
  'related-links',
  'divider',
  'card-display-table',
  'flexible-table',
  'rich-text',
  'media-gallery'
));
