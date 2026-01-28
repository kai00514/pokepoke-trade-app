"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { useTranslations } from "next-intl"

export default function MatchingThanks() {
  const t = useTranslations()
  
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
        <div className="bg-green-100 p-4 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">{t('survey.thankYou')}</h2>
          <p className="text-slate-600 leading-relaxed max-w-md">
            {t('survey.thankYouMessage')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
