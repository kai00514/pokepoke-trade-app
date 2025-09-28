-- Check current constraint
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    -- Check if the constraint exists
    SELECT EXISTS (
        SELECT 1 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'info_article_blocks' 
        AND c.conname = 'info_blocks_type_allowed'
    ) INTO constraint_exists;

    -- Drop the constraint if it exists
    IF constraint_exists THEN
        ALTER TABLE info_article_blocks DROP CONSTRAINT info_blocks_type_allowed;
        RAISE NOTICE 'Dropped existing constraint info_blocks_type_allowed';
    END IF;

    -- Create the new constraint with all allowed block types
    ALTER TABLE info_article_blocks ADD CONSTRAINT info_blocks_type_allowed 
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

    RAISE NOTICE 'Created new constraint info_blocks_type_allowed with all block types';
END $$;
