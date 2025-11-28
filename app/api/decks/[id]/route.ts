import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  localizeDeck,
  parseAcceptLanguage,
  normalizeLocale,
} from '@/lib/i18n-helpers';

/**
 * GET /api/decks/[id]
 * ユーザー作成デッキを取得（多言語対応）
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

    // デッキIDの検証
    const { id } = await params;
    const deckId = parseInt(id);
    if (isNaN(deckId)) {
      return NextResponse.json(
        { error: 'Invalid deck ID' },
        { status: 400 }
      );
    }

    // デッキを取得
    const { data: deck, error } = await supabase
      .from('decks')
      .select(
        `
        id,
        user_id,
        title,
        title_multilingual,
        description,
        description_multilingual,
        deck_code,
        is_public,
        favorite_count,
        translation_status,
        created_at,
        updated_at
      `
      )
      .eq('id', deckId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Deck not found' },
          { status: 404 }
        );
      }
      console.error('Deck fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deck' },
        { status: 500 }
      );
    }

    // 非公開デッキのアクセス制御（必要に応じて）
    if (!deck.is_public) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== deck.user_id) {
        return NextResponse.json(
          { error: 'Deck is not public' },
          { status: 403 }
        );
      }
    }

    // デッキを多言語化
    const localizedDeck = localizeDeck(deck, locale);

    return NextResponse.json({
      deck: localizedDeck,
      locale,
    });
  } catch (error) {
    console.error('Deck API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
