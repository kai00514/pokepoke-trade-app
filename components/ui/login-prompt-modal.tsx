"use client"

import type React from "react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Lock, UserPlus } from "lucide-react"

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  onContinueAsGuest?: () => void
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  title = "ログインが必要です",
  description = "この機能を利用するには、ログインまたは新規登録を行ってください。",
  onContinueAsGuest,
}) => {
  const router = useRouter()

  const handleLogin = () => {
    onClose()
    router.push("/auth/login")
  }

  const handleRegister = () => {
    onClose()
    router.push("/auth/signup")
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-gray-600 mt-2">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col space-y-3 sm:flex-col sm:space-x-0 sm:space-y-3">
          <Button onClick={handleLogin} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <Lock className="mr-2 h-4 w-4" /> ログイン
          </Button>
          <Button onClick={handleRegister} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="mr-2 h-4 w-4" /> 新規登録
          </Button>
          {onContinueAsGuest && (
            <Button
              onClick={onContinueAsGuest}
              variant="outline"
              className="w-full text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
            >
              ゲストとして続ける
            </Button>
          )}
          <AlertDialogCancel className="w-full text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600">
            閉じる
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default LoginPromptModal
