import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  localizeTradePost,
  parseAcceptLanguage,
  normalizeLocale,
} from '@/lib/i18n-helpers';

/**
 * GET /api/trades/[id]
 * トレード投稿を取得（多言語対応）
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

    // トレード投稿IDの検証
    const { id } = await params;
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid trade post ID' },
        { status: 400 }
      );
    }

    // トレード投稿を取得
    const { data: post, error } = await supabase
      .from('trade_posts')
      .select(
        `
        id,
        owner_id,
        title,
        title_multilingual,
        comment,
        comment_multilingual,
        status,
        translation_status,
        created_at,
        updated_at
      `
      )
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Trade post not found' },
          { status: 404 }
        );
      }
      console.error('Trade post fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trade post' },
        { status: 500 }
      );
    }

    // トレード投稿を多言語化
    const localizedPost = localizeTradePost(post, locale);

    return NextResponse.json({
      post: localizedPost,
      locale,
    });
  } catch (error) {
    console.error('Trade post API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
