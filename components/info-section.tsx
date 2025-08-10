import Link from "next/link"
import type { ReactNode } from "react"

type Props = {
  title: string
  icon?: ReactNode
  children?: ReactNode
  viewAllLink?: string
  viewAllText?: string
}

export default function InfoSection({ title, icon, children, viewAllLink, viewAllText }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon ? <div className="text-sky-600">{icon}</div> : null}
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">{title}</h2>
        </div>
        {viewAllLink ? (
          <Link
            href={viewAllLink}
            className="text-sm text-sky-700 hover:text-sky-900 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-md px-2 py-1"
          >
            {viewAllText || "もっと見る"}
          </Link>
        ) : null}
      </div>
      <div className="rounded-2xl bg-white shadow p-3 sm:p-4">{children}</div>
    </section>
  )
}
