import type React from "react"
import type { Metadata } from "next"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import GoogleAnalytics from "@/components/analytics/google-analytics"
import { Suspense } from "react"
import PageViewTracker from "@/components/analytics/page-view-tracker"
import { locales } from '@/i18n';

import { Inter, Geist as V0_Font_Geist, Geist_Mono as V0_Font_Geist_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Initialize fonts
const _geist = V0_Font_Geist({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

const inter = Inter({ subsets: ["latin"] })

// Metadata is generated dynamically per locale in generateMetadata function below

// generateStaticParams for all locales
// Generate metadata dynamically based on locale
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  // Define metadata translations
  const metadataTranslations: Record<string, { title: string; description: string }> = {
    ja: {
      title: "ポケリンクトレード掲示板",
      description: "ポケットモンスターのカードをトレードしましょう!"
    },
    en: {
      title: "Pokelink Trade Board",
      description: "Trade Pokémon cards with other players!"
    },
    'zh-cn': {
      title: "宝可梦交易板",
      description: "与其他玩家交易宝可梦卡牌！"
    },
    'zh-tw': {
      title: "寶可夢交易板",
      description: "與其他玩家交易寶可夢卡牌！"
    },
    ko: {
      title: "포켓몬 트레이드 게시판",
      description: "다른 플레이어와 포켓몬 카드를 교환하세요!"
    },
    fr: {
      title: "Tableau d'échange Pokémon",
      description: "Échangez des cartes Pokémon avec d'autres joueurs !"
    },
    es: {
      title: "Tablero de intercambio Pokémon",
      description: "¡Intercambia cartas Pokémon con otros jugadores!"
    },
    de: {
      title: "Pokémon-Tauschbrett",
      description: "Tausche Pokémon-Karten mit anderen Spielern!"
    }
  };

  const metadata = metadataTranslations[locale] || metadataTranslations.ja;

  return {
    title: metadata.title,
    description: metadata.description,
    generator: "v0.dev",
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  const { locale } = await params;
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <div lang={locale} className={`${inter.className} bg-gradient-to-br from-purple-50 to-purple-100 min-h-screen`}>
      <NextIntlClientProvider messages={messages}>
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  )
}
