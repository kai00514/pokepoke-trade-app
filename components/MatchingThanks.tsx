"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function MatchingThanks() {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
        <div className="bg-green-100 p-4 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">ご回答ありがとうございました！</h2>
          <p className="text-slate-600 leading-relaxed max-w-md">
            いただいたご意見を参考に、より良いマッチング体験をお届けします。公開まで少々お待ちください。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
