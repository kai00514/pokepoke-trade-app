import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// 対応言語リスト（lib/i18n-helpers.tsと同期）
export const locales = ['ja', 'en', 'zh-cn', 'zh-tw', 'ko', 'fr', 'es', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

export default getRequestConfig(async ({ locale }) => {
  // 対応していないロケールの場合は404
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: {
      // 全てのメッセージファイルを統合読み込み
      ...(await import(`./locales/${locale}/common.json`)).default,
      ...(await import(`./locales/${locale}/auth.json`)).default,
      ...(await import(`./locales/${locale}/cards.json`)).default,
      ...(await import(`./locales/${locale}/errors.json`)).default,
      ...(await import(`./locales/${locale}/forms.json`)).default,
      ...(await import(`./locales/${locale}/messages.json`)).default,
      ...(await import(`./locales/${locale}/pages.json`)).default,
    },
  };
});
