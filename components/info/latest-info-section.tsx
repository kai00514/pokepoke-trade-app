import { Link } from "@/lib/i18n-navigation"
import { Newspaper } from "lucide-react"
import { getInfoList } from "@/lib/actions/info-articles"
import { LatestInfoCarousel } from "./latest-info-carousel"
import { getTranslations } from "next-intl/server"

export default async function LatestInfoSection() {
  const items = await getInfoList(5, 0)
  const t = await getTranslations('info')

  return (
    <section aria-labelledby="latest-info-title" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Newspaper className="h-4 w-4" />
          </span>
          <h2 id="latest-info-title" className="text-base sm:text-lg font-semibold text-slate-900">
            {t('sections.latestNews')}
          </h2>
        </div>
        <Link href="/info/news" className="text-sm font-medium text-blue-700 hover:underline" prefetch={false}>
          {t('viewAllLatestInfo')}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-slate-600 text-sm">
          {t('noLatestInfo')}
        </div>
      ) : (
        <LatestInfoCarousel items={items} />
      )}
    </section>
  )
}
