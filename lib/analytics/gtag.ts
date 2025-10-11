// Google Analytics イベントトラッキング用ユーティリティ

// Window オブジェクトに gtag を追加
declare global {
  interface Window {
    gtag?: (command: "config" | "event" | "js", targetId: string | Date, config?: Record<string, any>) => void
    dataLayer?: any[]
  }
}

// ページビューを送信
export const pageview = (url: string): void => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      page_path: url,
    })
  }
}

// カスタムイベントを送信
export const event = (action: string, params?: Record<string, any>): void => {
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", action, params)

    // 開発環境ではコンソールにログ出力
    if (process.env.NODE_ENV === "development") {
      console.log("[GA Event]", action, params)
    }
  } else if (process.env.NODE_ENV === "development") {
    console.log("[GA Event - gtag not loaded]", action, params)
  }
}

// TypeScript用の型定義
export type GtagEvent = {
  action: string
  category?: string
  label?: string
  value?: number
  [key: string]: any
}
