import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  localizeInfoPage,
  parseAcceptLanguage,
  normalizeLocale,
} from '@/lib/i18n-helpers';

/**
 * GET /api/info/[id]
 * 記事ページを取得（多言語対応）
 *
 * Query Parameters:
 * - locale: 言語コード（例: en, ja, ko）
 *
 * Headers:
 * - Accept-Language: 優先言語（localeパラメータがない場合に使用）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // 記事IDの検証
    const pageId = parseInt(params.id);
    if (isNaN(pageId)) {
      return NextResponse.json(
        { error: 'Invalid page ID' },
        { status: 400 }
      );
    }

    // 記事ページを取得
    const { data: page, error } = await supabase
      .from('info_pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        );
      }
      console.error('Info page fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch page' },
        { status: 500 }
      );
    }

    // ページを多言語化
    const localizedPage = localizeInfoPage(page, locale);

    return NextResponse.json({
      page: localizedPage,
      locale,
    });
  } catch (error) {
    console.error('Info page API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
