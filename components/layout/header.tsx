"use client"
import { useRouter } from "next/router"
import { DropdownMenuItem, MessageCircle } from "@components"

const Header = () => {
  const router = useRouter()

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img className="block h-8 w-auto" src="/logo.svg" alt="Logo" />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">{/* Navigation links here */}</div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {/* Profile dropdown here */}
              <DropdownMenuItem
                onClick={() => router.push("/register")}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  {/* User icon here */}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">ユーザー名登録</p>
                  <p className="text-xs text-gray-500">新しいユーザー名を登録</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/contact")}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">お問い合わせ</p>
                  <p className="text-xs text-gray-500">ご質問やご要望をお聞かせください</p>
                </div>
              </DropdownMenuItem>
              {/* Divider here */}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
