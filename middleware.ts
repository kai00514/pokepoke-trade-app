import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // 対応言語リスト
  locales,

  // デフォルト言語
  defaultLocale,

  // ロケールプレフィックスを常に表示（URLは /ja/matching, /en/matching など）
  localePrefix: 'always',

  // ロケール検出方法
  localeDetection: true,
});

export const config = {
  // next-intlミドルウェアを適用するパス
  // auth, admin, api, publicファイル、_nextを除外
  matcher: ['/((?!auth|admin|api|_next|_vercel|.*\\..*).*)'],
};
