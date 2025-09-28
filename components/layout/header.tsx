"use client"
import { useRouter } from "next/router"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { User, LogOut, Settings, MessageCircle } from "lucide-react"

const Header = () => {
  const router = useRouter()

  return (
    <header className="bg-white p-4">
      <nav className="flex justify-between">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-xl">My App</span>
        </div>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
              <User className="w-6 h-6 mr-2" />
              Username
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-2" align="end">
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center"
              >
                <Settings className="w-4 h-4 mr-3" />
                設定
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/contact")}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center"
              >
                <MessageCircle className="w-4 h-4 mr-3" />
                お問い合わせ
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/logout")}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-3" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  )
}

export default Header
