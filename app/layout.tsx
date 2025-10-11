import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import GoogleAnalytics from "@/components/analytics/google-analytics"
import { Suspense } from "react"
import PageViewTracker from "@/components/analytics/page-view-tracker"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ポケリンクトレード掲示板",
  description: "ポケットモンスターのカードをトレードしましょう!",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-br from-purple-50 to-purple-100 min-h-screen`}>
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
      </body>
    </html>
  )
}
