import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  localizeCard,
  parseAcceptLanguage,
  normalizeLocale,
} from '@/lib/i18n-helpers';

/**
 * GET /api/cards
 * カード一覧を取得（多言語対応）
 *
 * Query Parameters:
 * - locale: 言語コード（例: en, ja, ko）
 * - pack_id: パックIDでフィルタ（オプション）
 * - limit: 取得件数（デフォルト: 100、最大: 500）
 * - offset: オフセット（ページネーション用）
 *
 * Headers:
 * - Accept-Language: 優先言語（localeパラメータがない場合に使用）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 言語の決定（優先順位: クエリパラメータ > Accept-Language > デフォルト）
    const localeParam = searchParams.get('locale');
    const acceptLanguage = request.headers.get('Accept-Language');
    const locale = localeParam
      ? normalizeLocale(localeParam)
      : parseAcceptLanguage(acceptLanguage);

    // クエリパラメータの取得
    const packId = searchParams.get('pack_id');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '100'),
      500
    );
    const offset = parseInt(searchParams.get('offset') || '0');

    // Supabaseクエリの構築
    let query = supabase
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
        col_5
      `
      )
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1);

    // パックIDでフィルタ
    if (packId) {
      query = query.eq('pack_id', parseInt(packId));
    }

    const { data: cards, error } = await query;

    if (error) {
      console.error('Cards fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }

    // 各カードを多言語化
    const localizedCards = (cards || []).map((card) =>
      localizeCard(card, locale)
    );

    return NextResponse.json({
      cards: localizedCards,
      locale,
      count: localizedCards.length,
      hasMore: localizedCards.length === limit,
    });
  } catch (error) {
    console.error('Cards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
