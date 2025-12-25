import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  localizeTradePost,
  parseAcceptLanguage,
  normalizeLocale,
} from '@/lib/i18n-helpers';

/**
 * GET /api/trades
 * トレード投稿一覧を取得（多言語対応）
 *
 * Query Parameters:
 * - locale: 言語コード（例: en, ja, ko）
 * - status: ステータスフィルタ（open, closed, cancelled）
 * - limit: 取得件数（デフォルト: 20、最大: 100）
 * - offset: オフセット（ページネーション用）
 *
 * Headers:
 * - Accept-Language: 優先言語（localeパラメータがない場合に使用）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 言語の決定
    const localeParam = searchParams.get('locale');
    const acceptLanguage = request.headers.get('Accept-Language');
    const locale = localeParam
      ? normalizeLocale(localeParam)
      : parseAcceptLanguage(acceptLanguage);

    // クエリパラメータの取得
    const status = searchParams.get('status');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20'),
      100
    );
    const offset = parseInt(searchParams.get('offset') || '0');

    // Supabaseクエリの構築
    let query = supabase
      .from('trade_posts')
      .select(
        `
        id,
        owner_id,
        title,
        title_multilingual,
        comment,
        status,
        translation_status,
        created_at,
        updated_at
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // ステータスでフィルタ
    if (status) {
      query = query.eq('status', status);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Trade posts fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trade posts' },
        { status: 500 }
      );
    }

    // 各投稿を多言語化
    const localizedPosts = (posts || []).map((post) =>
      localizeTradePost(post, locale)
    );

    return NextResponse.json({
      posts: localizedPosts,
      locale,
      count: localizedPosts.length,
      hasMore: localizedPosts.length === limit,
    });
  } catch (error) {
    console.error('Trade posts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
