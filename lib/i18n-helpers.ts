/**
 * i18n-helpers.ts
 * JSONB多言語フィールドから言語を抽出するヘルパー関数群
 *
 * 使用例:
 * const name = getLocalizedText(card.name_multilingual, 'en');
 * const cards = getLocalizedArray(page.deck_cards_multilingual, 'en');
 */

/**
 * 対応言語リスト
 */
export const SUPPORTED_LANGUAGES = [
  'ja',
  'en',
  'ko',
  'zh-TW',
  'fr',
  'es',
  'de',
  'it',
  'pt-br',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * デフォルト言語（日本語）
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'ja';

/**
 * フォールバック言語の優先順位
 * 指定された言語が見つからない場合、この順序で探す
 */
export const FALLBACK_LANGUAGES: SupportedLanguage[] = ['ja', 'en'];

/**
 * JSONBフィールドから指定言語のテキストを抽出（フォールバック付き）
 *
 * @param multilingual - JSONB多言語オブジェクト
 * @param locale - 取得したい言語コード
 * @param fallback - すべての言語が見つからない場合のデフォルト値
 * @returns 指定言語のテキスト、なければフォールバック言語、なければデフォルト値
 *
 * @example
 * const name = getLocalizedText(
 *   { ja: "ピカチュウex", en: "Pikachu ex", ko: "피카츄ex" },
 *   'en'
 * ); // "Pikachu ex"
 *
 * @example
 * const name = getLocalizedText(
 *   { ja: "ピカチュウex" },
 *   'fr'
 * ); // "ピカチュウex" (フォールバック)
 */
export function getLocalizedText(
  multilingual: Record<string, string> | null | undefined,
  locale: string,
  fallback: string = ''
): string {
  if (!multilingual) return fallback;

  // 指定された言語が存在すればそれを返す
  if (multilingual[locale]) {
    return multilingual[locale];
  }

  // フォールバック言語を順番に試す
  for (const fallbackLang of FALLBACK_LANGUAGES) {
    if (multilingual[fallbackLang]) {
      return multilingual[fallbackLang];
    }
  }

  // すべて見つからなければデフォルト値を返す
  return fallback;
}

/**
 * JSONB配列フィールドから指定言語の配列を抽出
 *
 * @param multilingual - JSONB多言語配列オブジェクト
 * @param locale - 取得したい言語コード
 * @returns 指定言語の配列、なければフォールバック言語、なければ空配列
 *
 * @example
 * const cards = getLocalizedArray(
 *   {
 *     ja: [{ card_id: 1, pack_name: "遺伝子の頂点" }],
 *     en: [{ card_id: 1, pack_name: "Genetic Apex" }]
 *   },
 *   'en'
 * ); // [{ card_id: 1, pack_name: "Genetic Apex" }]
 */
export function getLocalizedArray<T>(
  multilingual: Record<string, T[]> | null | undefined,
  locale: string
): T[] {
  if (!multilingual) return [];

  // 指定された言語が存在すればそれを返す
  if (multilingual[locale]) {
    return multilingual[locale];
  }

  // フォールバック言語を順番に試す
  for (const fallbackLang of FALLBACK_LANGUAGES) {
    if (multilingual[fallbackLang]) {
      return multilingual[fallbackLang];
    }
  }

  // すべて見つからなければ空配列を返す
  return [];
}

/**
 * オブジェクト全体を多言語化
 * 指定されたフィールドの `*_multilingual` から言語を抽出して、元のフィールドに上書き
 *
 * @param obj - 多言語フィールドを含むオブジェクト
 * @param locale - 取得したい言語コード
 * @param fields - 多言語化するフィールド名のリスト
 * @returns 多言語化されたオブジェクト
 *
 * @example
 * const card = {
 *   id: 1,
 *   name: "ピカチュウex",
 *   name_multilingual: { ja: "ピカチュウex", en: "Pikachu ex" },
 *   image_url: "...",
 *   image_url_multilingual: { ja: "...", en: "..." }
 * };
 *
 * const localizedCard = localizeObject(card, 'en', ['name', 'image_url']);
 * // { id: 1, name: "Pikachu ex", image_url: "...", ... }
 */
export function localizeObject<T extends Record<string, any>>(
  obj: T,
  locale: string,
  fields: (keyof T)[]
): T {
  const result = { ...obj };

  fields.forEach((field) => {
    const multilingualField = `${String(field)}_multilingual` as keyof T;

    if (multilingualField in obj) {
      const multilingualValue = obj[multilingualField];

      // 配列の場合
      if (Array.isArray(multilingualValue)) {
        result[field] = getLocalizedArray(
          multilingualValue as any,
          locale
        ) as T[keyof T];
      }
      // オブジェクトの場合
      else if (typeof multilingualValue === 'object' && multilingualValue !== null) {
        result[field] = getLocalizedText(
          multilingualValue as any,
          locale,
          obj[field] as string
        ) as T[keyof T];
      }
    }
  });

  return result;
}

/**
 * カードオブジェクトを多言語化
 *
 * @param card - カードオブジェクト
 * @param locale - 取得したい言語コード
 * @returns 多言語化されたカードオブジェクト
 *
 * @example
 * const card = await supabase.from('cards').select('*').eq('id', 1).single();
 * const localizedCard = localizeCard(card.data, 'en');
 */
export function localizeCard<T extends Record<string, any>>(
  card: T,
  locale: string
): T {
  return localizeObject(card, locale, ['name', 'image_url', 'description']);
}

/**
 * デッキページオブジェクトを多言語化
 *
 * @param page - デッキページオブジェクト
 * @param locale - 取得したい言語コード
 * @returns 多言語化されたデッキページオブジェクト
 */
export function localizeDeckPage<T extends Record<string, any>>(
  page: T,
  locale: string
): T {
  return localizeObject(page, locale, [
    'title',
    'deck_name',
    'deck_description',
    'deck_badge',
    'evaluation_title',
    'tier_name',
    'section1_title',
    'section2_title',
    'section3_title',
    'thumbnail_alt',
    'thumbnail_image_url',
    'energy_image_url',
    'tier_descriptions',
    'strengths_weaknesses_details',
    'strengths_weaknesses_list',
    'how_to_play_steps',
    'how_to_play_list',
    'deck_cards',
  ]);
}

/**
 * 記事ページオブジェクトを多言語化
 *
 * @param page - 記事ページオブジェクト
 * @param locale - 取得したい言語コード
 * @returns 多言語化された記事ページオブジェクト
 */
export function localizeInfoPage<T extends Record<string, any>>(
  page: T,
  locale: string
): T {
  return localizeDeckPage(page, locale); // deck_pagesと同じ構造
}

/**
 * 記事オブジェクトを多言語化
 *
 * @param article - 記事オブジェクト
 * @param locale - 取得したい言語コード
 * @returns 多言語化された記事オブジェクト
 */
export function localizeInfoArticle<T extends Record<string, any>>(
  article: T,
  locale: string
): T {
  return localizeObject(article, locale, [
    'slug',
    'title',
    'subtitle',
    'excerpt',
    'thumbnail_image_url',
    'hero_image_url',
    'tags',
  ]);
}

/**
 * デッキオブジェクトを多言語化
 *
 * @param deck - デッキオブジェクト
 * @param locale - 取得したい言語コード
 * @returns 多言語化されたデッキオブジェクト
 */
export function localizeDeck<T extends Record<string, any>>(
  deck: T,
  locale: string
): T {
  return localizeObject(deck, locale, ['title', 'description']);
}

/**
 * トレード投稿オブジェクトを多言語化
 *
 * @param post - トレード投稿オブジェクト
 * @param locale - 取得したい言語コード
 * @returns 多言語化されたトレード投稿オブジェクト
 */
export function localizeTradePost<T extends Record<string, any>>(
  post: T,
  locale: string
): T {
  // wanted_card_id and offered_card_id are now integer[] (not JSONB)
  // Card data is fetched from cards table with multilingual support
  // So we only need to localize title and comment
  return localizeObject(post, locale, [
    'title',
    'comment',
  ]);
}

/**
 * 言語コードが対応言語かどうかを確認
 *
 * @param locale - 確認する言語コード
 * @returns 対応言語であればtrue
 */
export function isSupportedLanguage(locale: string): locale is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(locale as SupportedLanguage);
}

/**
 * 言語コードを正規化（対応していない場合はデフォルト言語を返す）
 *
 * @param locale - 正規化する言語コード
 * @returns 正規化された言語コード
 */
export function normalizeLocale(locale: string | null | undefined): SupportedLanguage {
  if (!locale) return DEFAULT_LANGUAGE;

  const normalized = locale.toLowerCase();

  if (isSupportedLanguage(normalized)) {
    return normalized;
  }

  // zh-CN を zh-TW にマッピング（必要に応じて調整）
  if (normalized === 'zh-cn' || normalized === 'zh') {
    return 'zh-TW';
  }

  // pt を pt-br にマッピング
  if (normalized === 'pt') {
    return 'pt-br';
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Accept-Languageヘッダーから優先言語を抽出
 *
 * @param acceptLanguage - Accept-Languageヘッダーの値
 * @returns 優先言語コード
 *
 * @example
 * const locale = parseAcceptLanguage('en-US,en;q=0.9,ja;q=0.8');
 * // 'en'
 */
export function parseAcceptLanguage(
  acceptLanguage: string | null | undefined
): SupportedLanguage {
  if (!acceptLanguage) return DEFAULT_LANGUAGE;

  // Accept-Languageヘッダーをパース
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, qValue] = lang.trim().split(';q=');
      return {
        code: code.split('-')[0].toLowerCase(),
        q: qValue ? parseFloat(qValue) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);

  // 対応言語で最も優先度の高いものを返す
  for (const lang of languages) {
    if (isSupportedLanguage(lang.code)) {
      return lang.code;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get localized card name from card data
 * 
 * @param card - Card object with name and name_multilingual fields
 * @param locale - Language code to retrieve
 * @returns Localized card name, fallback to Japanese if not found
 * 
 * @example
 * const card = { 
 *   name: "ピカチュウex", 
 *   name_multilingual: { ja: "ピカチュウex", en: "Pikachu ex" } 
 * };
 * const localizedName = getLocalizedCardName(card, 'en'); // "Pikachu ex"
 */
export function getLocalizedCardName(
  card: { name: string; name_multilingual?: Record<string, string> | null },
  locale: string
): string {
  if (card.name_multilingual && card.name_multilingual[locale]) {
    return card.name_multilingual[locale];
  }
  
  // Fallback to Japanese (card.name is always Japanese)
  return card.name;
}

/**
 * Get localized card image URL from card data
 * 
 * @param card - Card object with image_url and image_url_multilingual fields
 * @param locale - Language code to retrieve
 * @returns Localized card image URL, fallback to Japanese/default if not found
 * 
 * @example
 * const card = { 
 *   image_url: "https://.../ja.webp", 
 *   image_url_multilingual: { 
 *     ja: "https://.../ja.webp", 
 *     en: "https://assets.tcgdex.net/en/tcgp/P-A/013/low.webp" 
 *   },
 *   thumb_url: "https://.../thumb.webp"
 * };
 * const localizedImage = getLocalizedCardImage(card, 'en'); // "https://assets.tcgdex.net/en/..."
 */
export function getLocalizedCardImage(
  card: { 
    image_url: string; 
    image_url_multilingual?: Record<string, string> | null;
    thumb_url?: string;
  },
  locale: string
): string {
  // Try to get localized image URL
  if (card.image_url_multilingual && card.image_url_multilingual[locale]) {
    return card.image_url_multilingual[locale];
  }
  
  // Fallback to thumb_url if available, otherwise image_url
  return card.thumb_url || card.image_url;
}
