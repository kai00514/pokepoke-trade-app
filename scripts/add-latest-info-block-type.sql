-- Add latest-info block type to the allowed types constraint
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
  'divider', 
  'button', 
  'pickup', 
  'cards-table', 
  'card-display-table', 
  'key-value-table', 
  'flexible-table', 
  'toc', 
  'related-links', 
  'evaluation', 
  'media-gallery', 
  'rich-text',
  'latest-info'
));
