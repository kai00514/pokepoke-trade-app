import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Suspense } from "react" // Suspenseをインポート

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ポケリンクトレード掲示板",
  description: "ポケットポケットのカードをトレードしましょう！",
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <Suspense fallback={<div>Loading application...</div>}>{children}</Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
