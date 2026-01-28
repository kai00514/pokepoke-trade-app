"use client"

import { Link } from "@/lib/i18n-navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useRouter } from "@/lib/i18n-navigation"
import { useState } from "react"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { updateUserProfile } from "@/lib/services/user-service"
import { MessageCircle, Settings, User, LogOut, IdCard, UserCircle, Languages } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { locales } from "@/i18n"

// 言語情報の定義
const languageNames: Record<string, { name: string; flag: string }> = {
  'ja': { name: '日本語', flag: '🇯🇵' },
  'en': { name: 'English', flag: '🇺🇸' },
  'zh-cn': { name: '简体中文', flag: '🇨🇳' },
  'zh-tw': { name: '繁體中文', flag: '🇹🇼' },
  'ko': { name: '한국어', flag: '🇰🇷' },
  'fr': { name: 'Français', flag: '🇫🇷' },
  'es': { name: 'Español', flag: '🇪🇸' },
  'de': { name: 'Deutsch', flag: '🇩🇪' },
}

export default function Header() {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const { user, userProfile, loading, signOut, displayName } = useAuth()
  const router = useRouter()

  // モーダルの表示状態を管理するstate
  const [isPokepokeIdModalOpen, setIsPokepokeIdModalOpen] = useState(false)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {}
  }

  // ポケポケID登録のハンドラ
  const handlePokepokeIdRegistration = () => {
    setIsPokepokeIdModalOpen(true)
  }

  // ユーザー名登録のハンドラ
  const handleUsernameRegistration = () => {
    setIsUsernameModalOpen(true)
  }

  // お問い合わせのハンドラ
  const handleContactClick = () => {
    router.push("/contact")
  }

  // 言語切り替えのハンドラ
  const handleLanguageChange = (newLocale: string) => {
    // 現在のパスから言語プレフィックスを除去
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[a-z]{2})?/, '') || '/'
    // 新しい言語プレフィックスを付けてリダイレクト
    window.location.href = `/${newLocale}${pathWithoutLocale}`
  }

  // ポケポケID保存のハンドラ
  const handleSavePokepokeId = async (pokepokeId: string) => {
    if (!user) {
      throw new Error(t('errors.auth.notAuthenticated'))
    }
    try {
      await updateUserProfile(user.id, { pokepoke_id: pokepokeId })
    } catch (error) {
      throw error
    }
  }

  // ユーザー名保存のハンドラ
  const handleSaveUsername = async (username: string) => {
    if (!user) {
      throw new Error(t('errors.auth.notAuthenticated'))
    }
    try {
      await updateUserProfile(user.id, { display_name: username })
    } catch (error) {
      throw error
    }
  }

  return (
    <header className="relative overflow-hidden text-white shadow-md border-b border-white/10 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/pokelink-logo.png" alt="PokeLink ロゴ" width={192} height={48} className="object-contain h-12" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* 言語切り替えボタン */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:bg-white/20 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200"
                    aria-label="言語を選択"
                  >
                    <Languages className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  alignOffset={-8}
                  className="w-48 shadow-lg border bg-white rounded-lg overflow-hidden p-0"
                >
                  <div className="py-0.5">
                    {locales.map((loc) => (
                      <DropdownMenuItem
                        key={loc}
                        onClick={() => handleLanguageChange(loc)}
                        className={`cursor-pointer px-2.5 py-1.5 hover:bg-gray-50 focus:bg-gray-50 transition-colors ${
                          locale === loc ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-lg">{languageNames[loc].flag}</span>
                          <span className={`text-xs ${locale === loc ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                            {languageNames[loc].name}
                          </span>
                          {locale === loc && (
                            <span className="ml-auto text-blue-600">✓</span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 通知ドロップダウン */}
              <NotificationDropdown />

              {/* 設定アイコン */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:bg-white/20 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200"
                    aria-label="設定メニューを開く"
                  >
                    <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="bottom"
                sideOffset={8}
                alignOffset={-8}
                className="w-56 shadow-lg border bg-white rounded-lg overflow-hidden p-0"
              >
                {/* メニューアイテム */}
                <div className="py-0.5">
                  <DropdownMenuItem 
                    onClick={handlePokepokeIdRegistration} 
                    className="cursor-pointer px-2.5 py-1.5 hover:bg-gray-50 focus:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <IdCard className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-700">{t('common.buttons.registerPokepokeId')}</span>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={handleUsernameRegistration} 
                    className="cursor-pointer px-2.5 py-1.5 hover:bg-gray-50 focus:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-700">{t('common.buttons.registerUsername')}</span>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={handleContactClick} 
                    className="cursor-pointer px-2.5 py-1.5 hover:bg-gray-50 focus:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-xs text-gray-700">{t('common.buttons.contact')}</span>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-0.5" />
                  
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="cursor-pointer px-2.5 py-1.5 hover:bg-red-50 focus:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <LogOut className="w-3 h-3 text-red-600" />
                      </div>
                      <span className="text-xs text-red-600 font-medium">{t('common.buttons.logout')}</span>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

              {/* アバター画像 */}
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                <div className="relative w-6 h-6 sm:w-8 sm:h-8">
                  {userProfile?.avatar_url ? (
                    <Image
                      src={userProfile.avatar_url || "/placeholder.svg"}
                      alt="ユーザーアバター"
                      width={32}
                      height={32}
                      className="rounded-full object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-white text-sm font-medium hidden sm:inline">{displayName}</span>
              </div>
            </>
          ) : (
            <>
              {/* 言語切り替えボタン（未ログインユーザー向け） */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:bg-white/20 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-all duration-200"
                    aria-label="言語を選択"
                  >
                    <Languages className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  alignOffset={-8}
                  className="w-48 shadow-lg border bg-white rounded-lg overflow-hidden p-0"
                >
                  <div className="py-0.5">
                    {locales.map((loc) => (
                      <DropdownMenuItem
                        key={loc}
                        onClick={() => handleLanguageChange(loc)}
                        className={`cursor-pointer px-2.5 py-1.5 hover:bg-gray-50 focus:bg-gray-50 transition-colors ${
                          locale === loc ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-lg">{languageNames[loc].flag}</span>
                          <span className={`text-xs ${locale === loc ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                            {languageNames[loc].name}
                          </span>
                          {locale === loc && (
                            <span className="ml-auto text-blue-600">✓</span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/auth/signup">
                <Button
                  variant="default"
                  className="bg-white text-[#1D4ED8] hover:bg-[#DBEAFE] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  {t('common.buttons.signup')}
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="bg-white text-[#1D4ED8] border-[#1D4ED8] hover:bg-[#DBEAFE] hover:text-[#1E40AF] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  {t('common.buttons.login')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {user && (
        <>
          <PokepokeIdRegistrationModal
            isOpen={isPokepokeIdModalOpen}
            onOpenChange={setIsPokepokeIdModalOpen}
            currentPokepokeId={userProfile?.pokepoke_id || ""}
            onSave={handleSavePokepokeId}
          />
          <UsernameRegistrationModal
            isOpen={isUsernameModalOpen}
            onOpenChange={setIsUsernameModalOpen}
            currentUsername={userProfile?.display_name || ""}
            onSave={handleSaveUsername}
          />
        </>
      )}
    </header>
  )
}
