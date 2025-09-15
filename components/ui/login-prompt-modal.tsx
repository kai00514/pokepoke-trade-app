"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserCircle, LogIn } from "lucide-react"

interface LoginPromptModalProps {
  onClose: () => void
  onContinueAsGuest: () => void
}

export default function LoginPromptModal({ onClose, onContinueAsGuest }: LoginPromptModalProps) {
  const handleLogin = () => {
    window.location.href = "/auth/login"
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 bg-gradient-to-br from-blue-50 to-violet-50 border-blue-200">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserCircle className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">ログインしますか？</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            ログインすると、あなたの名前とアバターでコメントが投稿されます。
            <br />
            ゲストとして投稿することも可能です。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={onContinueAsGuest}
            variant="outline"
            className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
          >
            <UserCircle className="w-4 h-4 mr-2" />
            ゲストとして投稿
          </Button>
          <Button onClick={handleLogin} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            <LogIn className="w-4 h-4 mr-2" />
            ログインして投稿
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
