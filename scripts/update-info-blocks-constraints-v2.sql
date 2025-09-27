-- info_article_blocks テーブルの制約を更新して新しいブロックタイプを許可
DO $$
BEGIN
    -- 既存の制約を削除
    ALTER TABLE info_article_blocks DROP CONSTRAINT IF EXISTS info_blocks_type_allowed;
    
    -- 新しい制約を追加（実装済みのブロックタイプのみ）
    ALTER TABLE info_article_blocks ADD CONSTRAINT info_blocks_type_allowed 
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
    
    -- パフォーマンス向上のためのインデックス
    CREATE INDEX IF NOT EXISTS idx_info_article_blocks_type ON info_article_blocks(type);
    CREATE INDEX IF NOT EXISTS idx_info_article_blocks_article_id ON info_article_blocks(article_id);
    CREATE INDEX IF NOT EXISTS idx_info_article_blocks_display_order ON info_article_blocks(display_order);
    
END $$;
