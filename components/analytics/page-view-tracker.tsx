"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

    if (!measurementId || typeof window.gtag === "undefined") {
      return
    }

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")

    window.gtag("config", measurementId, {
      page_path: url,
    })
  }, [pathname, searchParams])

  return null
}

declare global {
  interface Window {
    gtag: (command: "config" | "event" | "js", targetId: string | Date, config?: Record<string, any>) => void
    dataLayer: any[]
  }
}
