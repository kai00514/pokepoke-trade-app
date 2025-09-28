-- Add key-value-table to the allowed block types
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
  'key-value-table',
  'callout', 
  'toc', 
  'divider', 
  'related-links', 
  'evaluation', 
  'cards-table', 
  'card-display-table',
  'media-gallery',
  'pickup', 
  'button'
));
