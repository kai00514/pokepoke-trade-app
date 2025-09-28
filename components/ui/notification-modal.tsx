"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  showCancel?: boolean
}

export function NotificationModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmText = "OK",
  cancelText = "キャンセル",
  onConfirm,
  showCancel = false,
}: NotificationModalProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-500" />
      case "error":
        return <XCircle className="w-12 h-12 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />
      case "info":
        return <Info className="w-12 h-12 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50"
      case "error":
        return "bg-red-50"
      case "warning":
        return "bg-yellow-50"
      case "info":
        return "bg-blue-50"
    }
  }

  const getButtonColor = () => {
    switch (type) {
      case "success":
        return "bg-green-600 hover:bg-green-700"
      case "error":
        return "bg-red-600 hover:bg-red-700"
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700"
      case "info":
        return "bg-blue-600 hover:bg-blue-700"
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md ${getBackgroundColor()} border-0 shadow-2xl`}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">{getIcon()}</div>
          <DialogTitle className="text-xl font-semibold text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">{message}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-3 mt-6">
          {showCancel && (
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              {cancelText}
            </Button>
          )}
          <Button onClick={handleConfirm} className={`px-6 py-2 text-white ${getButtonColor()}`}>
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
