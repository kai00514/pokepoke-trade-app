import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  localizeCard,
  parseAcceptLanguage,
  normalizeLocale,
} from '@/lib/i18n-helpers';

/**
 * GET /api/cards/[id]
 * 個別カードを取得（多言語対応）
 *
 * Query Parameters:
 * - locale: 言語コード（例: en, ja, ko）
 *
 * Headers:
 * - Accept-Language: 優先言語（localeパラメータがない場合に使用）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 言語の決定
    const localeParam = searchParams.get('locale');
    const acceptLanguage = request.headers.get('Accept-Language');
    const locale = localeParam
      ? normalizeLocale(localeParam)
      : parseAcceptLanguage(acceptLanguage);

    // カードIDの検証
    const { id } = await params;
    const cardId = parseInt(id);
    if (isNaN(cardId)) {
      return NextResponse.json(
        { error: 'Invalid card ID' },
        { status: 400 }
      );
    }

    // カードを取得
    const { data: card, error } = await supabase
      .from('cards')
      .select(
        `
        id,
        name,
        name_multilingual,
        image_url,
        image_url_multilingual,
        type_code,
        rarity_code,
        pack_id,
        col_3,
        col_4,
        col_5,
        game8_image_url,
        created_at
      `
      )
      .eq('id', cardId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Card not found' },
          { status: 404 }
        );
      }
      console.error('Card fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch card' },
        { status: 500 }
      );
    }

    // カードを多言語化
    const localizedCard = localizeCard(card, locale);

    return NextResponse.json({
      card: localizedCard,
      locale,
    });
  } catch (error) {
    console.error('Card API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
