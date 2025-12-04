"use client"
import { Link } from "@/lib/i18n-navigation"
import { Home, Users, Layers, History, Info } from "lucide-react"
import { usePathname } from "@/lib/i18n-navigation"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export default function Footer() {
  const t = useTranslations()
  const pathname = usePathname()
  
  const navItems = [
    { name: t('common.navigation.home'), href: "/", icon: Home },
    { name: t('common.navigation.matching'), href: "/matching", icon: Users, soon: true },
    { name: t('common.navigation.decks'), href: "/decks", icon: Layers },
    { name: t('common.navigation.history'), href: "/history", icon: History },
    { name: t('common.navigation.info'), href: "/info", icon: Info },
  ]

  useEffect(() => {
    document.body.style.paddingBottom = "64px" // フッターの高さ分の余白を確実に設定
    document.body.style.position = "relative" // bodyの位置を相対位置に設定
    return () => {
      document.body.style.paddingBottom = ""
      document.body.style.position = ""
    }
  }, [])

  return (
    <footer className="bg-blue-600 shadow-lg fixed bottom-0 left-0 right-0 z-[9999] w-full">
      <nav className="container mx-auto px-2 py-1.5">
        <ul className="flex justify-around items-center">
          {navItems.map((item) => (
            <li key={item.name} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-1.5 rounded-md text-white hover:bg-blue-500 transition-colors group",
                  pathname === item.href && "text-blue-200",
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 mb-0.5" />
                  {item.soon && (
                    <span className="absolute -top-1 -right-3 bg-amber-400 text-white text-[0.6rem] px-1 py-0.5 rounded-full font-semibold">
                      SOON
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  )
}
