"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogIn, UserPlus } from "lucide-react"

type LoginPromptModalProps = {
  onClose: () => void
  onContinueAsGuest?: () => void
  showGuestButton?: boolean
}

export default function LoginPromptModal({
  onClose,
  onContinueAsGuest,
  showGuestButton = true,
}: LoginPromptModalProps) {
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const handleLogin = () => {
    router.push("/auth/login")
  }

  const handleRegister = () => {
    router.push("/auth/signup")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          アカウント登録でもっと便利に！
        </h2>
        <div className="text-gray-800 mb-6">
          <ol className="list-decimal list-inside space-y-1">
            <li>ポケポケID・ユーザー名を自動入力</li>
            <li>希望/譲渡カードのリスト作成</li>
            <li>通知アイコンで最新情報を受け取り</li>
            <li>履歴画面でトレード状況を確認</li>
            <li>デッキをお気に入り登録</li>
          </ol>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white rounded-lg py-3 text-center font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <LogIn size={18} className="mr-2" />
            ログイン
          </button>
          <button
            onClick={handleRegister}
            className="bg-[#e45858] text-white rounded-lg py-3 text-center font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center"
          >
            <UserPlus size={18} className="mr-2" />
            新規登録
          </button>
        </div>
        {showGuestButton && onContinueAsGuest && (
          <div className="text-center">
            <button
              onClick={onContinueAsGuest}
              className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
            >
              ゲストとして続ける
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
