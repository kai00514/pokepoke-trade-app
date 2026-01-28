/**
 * Admin Content Translation API
 * 
 * 管理側コンテンツ（info_pages, deck_pages, tournaments）を
 * バックグラウンドで自動翻訳するためのAPIエンドポイント
 * 
 * POST /api/admin/translate
 */

import { createClient } from '@/lib/supabase/server';
import { translateTextWithGlossary } from '@/lib/google-translate';
import { NextRequest, NextResponse } from 'next/server';

const TARGET_LANGUAGES = ['en', 'zh-tw', 'ko', 'fr', 'es', 'de'];

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Translate admin content
 */
export async function POST(request: NextRequest) {
  try {
    const { table, id, fields } = await request.json();

    // Validate input
    if (!table || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: table, id' },
        { status: 400 }
      );
    }

    // Validate table name
    const allowedTables = ['info_pages', 'deck_pages', 'tournaments'];
    if (!allowedTables.includes(table)) {
      return NextResponse.json(
        { error: 'Invalid table name' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the content
    const { data: content, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    const updates: any = {};
    const fieldsToTranslate = fields || ['title', 'description'];

    console.log(`[Admin Translate] Starting translation for ${table}/${id}`);
    console.log(`[Admin Translate] Fields: ${fieldsToTranslate.join(', ')}`);

    // Translate each field
    for (const field of fieldsToTranslate) {
      if (!content[field]) continue;

      const multilingualField = `${field}_multilingual`;
      const multilingual: Record<string, string> = { ja: content[field] };

      console.log(`[Admin Translate] Translating field: ${field}`);

      for (const targetLang of TARGET_LANGUAGES) {
        try {
          multilingual[targetLang] = await translateTextWithGlossary(
            content[field],
            'ja',
            targetLang,
            true
          );

          console.log(`[Admin Translate] ✅ ${field} -> ${targetLang}`);

          // Rate limiting: 100ms for short text, 200ms for long text
          const isLongText = content[field].length > 100;
          await sleep(isLongText ? 200 : 100);
        } catch (error) {
          console.error(`[Admin Translate] ❌ ${field} -> ${targetLang}:`, error);
          // Fallback to original text
          multilingual[targetLang] = content[field];
        }
      }

      updates[multilingualField] = multilingual;
    }

    // Translate deck_cards array if exists (for deck_pages/info_pages)
    if (content.deck_cards && Array.isArray(content.deck_cards)) {
      console.log(`[Admin Translate] Translating deck_cards array`);
      
      const cardsMultilingual: Record<string, any[]> = { ja: content.deck_cards };

      for (const targetLang of TARGET_LANGUAGES) {
        const translatedCards = [];

        for (const card of content.deck_cards) {
          const translatedCard = { ...card };

          // Translate pack_name if exists
          if (card.pack_name) {
            try {
              translatedCard.pack_name = await translateTextWithGlossary(
                card.pack_name,
                'ja',
                targetLang,
                true
              );
              await sleep(100);
            } catch (error) {
              console.error(`[Admin Translate] Card pack_name error:`, error);
              translatedCard.pack_name = card.pack_name;
            }
          }

          translatedCards.push(translatedCard);
        }

        cardsMultilingual[targetLang] = translatedCards;
        console.log(`[Admin Translate] ✅ deck_cards -> ${targetLang}`);
      }

      updates.deck_cards_multilingual = cardsMultilingual;
    }

    // Update database
    const { error: updateError } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error(`[Admin Translate] Update error:`, updateError);
      return NextResponse.json(
        { error: 'Failed to update content' },
        { status: 500 }
      );
    }

    console.log(`[Admin Translate] ✅ Translation completed for ${table}/${id}`);

    return NextResponse.json({
      success: true,
      message: 'Translation completed',
      fieldsTranslated: Object.keys(updates),
      languagesCount: TARGET_LANGUAGES.length,
    });
  } catch (error) {
    console.error('[Admin Translate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
