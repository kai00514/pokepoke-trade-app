import type React from "react"
import "./globals.css"

// ルートレイアウト: すべてのルートで共有される最上位レイアウト
// 子レイアウト（[locale]/layout.tsx, auth/layout.tsx）はこの中にネストされる
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
