"use client"

import Link from "next/link"
import type React from "react"
import { cn } from "@/lib/utils"

type IconType = React.ComponentType<{ className?: string }>

interface InfoSectionProps {
  icon: IconType
  title: string
  children: React.ReactNode
  viewAllLink?: string
  viewAllText?: string
  className?: string
}

/**
 * Blue-themed section wrapper used on /info.
 * Replaces any purple accents with blue:
 * - Icon chip: bg-blue-100 text-blue-700
 * - Title: text-slate-800
 * - "View all" link: text-blue-600 hover:text-blue-700 focus:ring-blue-500
 */
export default function InfoSection({
  icon: Icon,
  title,
  children,
  viewAllLink,
  viewAllText = "すべて見る",
  className,
}: InfoSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700"
            title=""
          >
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">{title}</h2>
        </div>

        {viewAllLink ? (
          <Link
            href={viewAllLink}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`${title} を${viewAllText}`}
          >
            <span>{viewAllText}</span>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l5 5a.997.997 0 01.083 1.32l-.083.094-5 5a1 1 0 01-1.497-1.32l.083-.094L13.585 10H4a1 1 0 01-.117-1.993L4 8h9.585l-3.292-3.293a1 1 0 01-.083-1.32l.083-.094z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        ) : null}
      </div>

      {children}
    </section>
  )
}
