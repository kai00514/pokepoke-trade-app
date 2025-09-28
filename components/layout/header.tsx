"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { PokepokeIdRegistrationModal } from "@/components/pokepoke-id-registration-modal"
import { UsernameRegistrationModal } from "@/components/username-registration-modal"
import { updateUserProfile } from "@/lib/services/user-service"
import { MessageCircle } from "lucide-react"

export default function Header() {
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

  // ポケポケID保存のハンドラ
  const handleSavePokepokeId = async (pokepokeId: string) => {
    if (!user) {
      throw new Error("ユーザーが認証されていません。")
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
      throw new Error("ユーザーが認証されていません。")
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
          {user && <NotificationDropdown />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors duration-200 cursor-pointer"
                  aria-label="ユーザーメニューを開く"
                >
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
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <span className="text-white text-sm font-medium hidden sm:inline">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden backdrop-blur-sm"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  boxShadow: "0 32px 64px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* ヘッダー部分 */}
                <div className="relative px-8 py-6 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                  <div className="relative flex items-center space-x-4">
                    <div className="relative">
                      {userProfile?.avatar_url ? (
                        <Image
                          src={userProfile.avatar_url || "/placeholder.svg"}
                          alt="ユーザーアバター"
                          width={56}
                          height={56}
                          className="rounded-full object-cover w-14 h-14 ring-4 ring-white/30 shadow-lg"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30 shadow-lg backdrop-blur-sm">
                          <div className="w-7 h-7 bg-white rounded-full" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-white truncate drop-shadow-sm">{displayName}</p>
                      <p className="text-sm text-white/90 font-medium">オンライン</p>
                    </div>
                  </div>
                </div>

                {/* メニュー項目 */}
                <div className="p-3">
                  <DropdownMenuItem
                    onClick={handlePokepokeIdRegistration}
                    className="cursor-pointer rounded-2xl px-5 py-4 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-300 flex items-center group border-0 focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <div className="w-6 h-6 bg-white rounded-full" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                        ポケポケID登録
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors duration-200">
                        あなた専用のIDを設定
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"></div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleUsernameRegistration}
                    className="cursor-pointer rounded-2xl px-5 py-4 text-sm hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:text-emerald-700 transition-all duration-300 flex items-center group border-0 focus:bg-gradient-to-r focus:from-emerald-50 focus:to-green-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <div className="w-6 h-6 bg-white rounded-full" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200">
                        ユーザー名登録
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-emerald-600 transition-colors duration-200">
                        表示名をカスタマイズ
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"></div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleContactClick}
                    className="cursor-pointer rounded-2xl px-5 py-4 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:text-orange-700 transition-all duration-300 flex items-center group border-0 focus:bg-gradient-to-r focus:from-orange-50 focus:to-amber-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-orange-700 transition-colors duration-200">
                        お問い合わせ
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-orange-600 transition-colors duration-200">
                        ご質問やご要望をお聞かせください
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"></div>
                  </DropdownMenuItem>

                  {/* 区切り線 */}
                  <div className="my-4 mx-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-2xl px-5 py-4 text-sm hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700 transition-all duration-300 flex items-center group border-0 focus:bg-gradient-to-r focus:from-red-50 focus:to-rose-50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <div className="w-6 h-6 bg-white rounded-full" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-red-700 transition-colors duration-200">
                        ログアウト
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-red-600 transition-colors duration-200">
                        アカウントから安全に退出
                      </p>
                    </div>
                    <div className="w-3 h-3 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"></div>
                  </DropdownMenuItem>
                </div>

                {/* フッター */}
                <div className="px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center font-medium">PokeLink v2.0</p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth/signup">
                <Button
                  variant="default"
                  className="bg-white text-[#1D4ED8] hover:bg-[#DBEAFE] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  新規登録
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="bg-white text-[#1D4ED8] border-[#1D4ED8] hover:bg-[#DBEAFE] hover:text-[#1E40AF] text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  ログイン
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
