import type React from "react"

// ルートレイアウト: 最小限の設定のみ
// 言語別の設定は app/[locale]/layout.tsx で行う
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children;
}
