import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// 対応言語リスト（lib/i18n-helpers.tsと同期）
export const locales = ['ja', 'en', 'zh-cn', 'zh-tw', 'ko', 'fr', 'es', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  // Load all message files for the locale
  const [common, auth, cards, errors, forms, messages, pages, trades, comments, decks, deckCreate, content, status, evaluation, survey, filters] = await Promise.all([
    import(`./locales/${locale}/common.json`),
    import(`./locales/${locale}/auth.json`),
    import(`./locales/${locale}/cards.json`),
    import(`./locales/${locale}/errors.json`),
    import(`./locales/${locale}/forms.json`),
    import(`./locales/${locale}/messages.json`),
    import(`./locales/${locale}/pages.json`),
    import(`./locales/${locale}/trades.json`),
    import(`./locales/${locale}/comments.json`),
    import(`./locales/${locale}/decks.json`),
    import(`./locales/${locale}/deckCreate.json`),
    import(`./locales/${locale}/content.json`),
    import(`./locales/${locale}/status.json`),
    import(`./locales/${locale}/evaluation.json`),
    import(`./locales/${locale}/survey.json`),
    import(`./locales/${locale}/filters.json`),
  ]);

  return {
    locale,
    messages: {
      common: common.default,
      auth: auth.default,
      cards: cards.default,
      errors: errors.default,
      forms: forms.default,
      messages: messages.default,
      pages: pages.default,
      trades: trades.default,
      comments: comments.default,
      decks: decks.default,
      deckCreate: deckCreate.default,
      content: content.default,
      status: status.default,
      evaluation: evaluation.default,
      survey: survey.default,
      filters: filters.default,
    }
  };
});
