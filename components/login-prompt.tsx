"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "@/lib/i18n-navigation"
import { LogIn, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"

type LoginPromptModalProps = {
  onClose: () => void
  onContinueAsGuest: () => void
}

export default function LoginPromptModal({ onClose, onContinueAsGuest }: LoginPromptModalProps) {
  const t = useTranslations()
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
    router.push("/login")
  }

  const handleRegister = () => {
    router.push("/register")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">{t('auth.loginPrompt.title')}</h2>
        <p className="text-gray-600 mb-6">
          {t('auth.loginPrompt.description')}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={handleLogin}
            className="bg-[#6246ea] text-white rounded-lg py-3 text-center font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center"
          >
            <LogIn size={18} className="mr-2" />
            {t('common.buttons.login')}
          </button>
          <button
            onClick={handleRegister}
            className="bg-[#e45858] text-white rounded-lg py-3 text-center font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center"
          >
            <UserPlus size={18} className="mr-2" />
            {t('common.buttons.signup')}
          </button>
        </div>
        <button
          onClick={onContinueAsGuest}
          className="w-full border border-gray-300 rounded-lg py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
{t('common.buttons.continueAsGuest')}
        </button>
      </div>
    </div>
  )
}
