"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

interface NotificationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  onConfirm?: () => void
  confirmText?: string
  showCancel?: boolean
}

export default function NotificationModal({
  isOpen,
  onOpenChange,
  type,
  title,
  message,
  onConfirm,
  confirmText = "OK",
  showCancel = false,
}: NotificationModalProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case "error":
        return <XCircle className="h-12 w-12 text-red-500" />
      case "warning":
        return <AlertCircle className="h-12 w-12 text-yellow-500" />
      case "info":
        return <Info className="h-12 w-12 text-blue-500" />
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

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className={`rounded-lg p-6 ${getBackgroundColor()}`}>
          <div className="flex flex-col items-center text-center space-y-4">
            {getIcon()}
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">{message}</DialogDescription>
            </DialogHeader>
            <div className="flex space-x-3 pt-4">
              {showCancel && (
                <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6">
                  キャンセル
                </Button>
              )}
              <Button
                onClick={handleConfirm}
                className={`px-6 ${
                  type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : type === "success"
                      ? "bg-green-600 hover:bg-green-700"
                      : type === "warning"
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
