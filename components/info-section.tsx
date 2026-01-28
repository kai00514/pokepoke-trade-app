import { Link } from "@/lib/i18n-navigation"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"

interface InfoSectionProps {
  icon: LucideIcon
  title: string
  viewAllLink: string
  children: ReactNode
}

export default async function InfoSection({ icon: Icon, title, viewAllLink, children }: InfoSectionProps) {
  const t = await getTranslations('info')

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <Link href={viewAllLink} className="text-sm font-medium text-blue-700 hover:underline" prefetch={false}>
          {t('viewAll')}
        </Link>
      </div>
      {children}
    </section>
  )
}
