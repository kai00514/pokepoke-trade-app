import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  localizeDeckPage,
  parseAcceptLanguage,
  normalizeLocale,
} from '@/lib/i18n-helpers';

/**
 * GET /api/deck-pages/[id]
 * デッキガイドページを取得（多言語対応）
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

    // デッキページIDの検証
    const { id } = await params;
    const pageId = parseInt(id);
    if (isNaN(pageId)) {
      return NextResponse.json(
        { error: 'Invalid page ID' },
        { status: 400 }
      );
    }

    // デッキページを取得
    const { data: page, error } = await supabase
      .from('deck_pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Deck page not found' },
          { status: 404 }
        );
      }
      console.error('Deck page fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deck page' },
        { status: 500 }
      );
    }

    // ページを多言語化
    const localizedPage = localizeDeckPage(page, locale);

    return NextResponse.json({
      page: localizedPage,
      locale,
    });
  } catch (error) {
    console.error('Deck page API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
