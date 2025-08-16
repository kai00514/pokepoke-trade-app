import { Star } from "lucide-react"

interface PickupInfoProps {
  items: string[]
}

export default function PickupInfo({ items }: PickupInfoProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="relative rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 shadow-sm">
      {/* Header pill */}
      <div className="absolute -top-2.5 left-4">
        <div className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 shadow-md">
          <span className="text-sm font-bold text-white">ピックアップ情報</span>
        </div>
      </div>

      {/* Content */}
      <div className="mt-1 pt-2">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <Star className="mt-0.5 h-4 w-4 flex-shrink-0 fill-blue-600 text-blue-600" />
              <span className="text-sm text-slate-800 leading-relaxed font-bold">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
