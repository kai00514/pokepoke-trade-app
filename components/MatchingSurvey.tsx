"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { FileText } from "lucide-react"
import confetti from "canvas-confetti"
import {
  type SurveyResponse,
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_OPTIONS,
  Q4_OPTIONS,
  type MatchingPrimaryPref,
  type Q2Value,
  type Q3Feature,
} from "@/lib/survey/constants"
import { useTranslations } from "next-intl"

interface MatchingSurveyProps {
  onSuccess: () => void
}

export default function MatchingSurvey({ onSuccess }: MatchingSurveyProps) {
  const { toast } = useToast()
  const t = useTranslations()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Translation key mappings for survey options
  const getQ1Label = (value: string) => {
    const keyMap: Record<string, string> = {
      want_match: "survey.q1.option1",
      offer_match: "survey.q1.option2",
      facet_search: "survey.q1.option3",
      direct_specify: "survey.q1.option4"
    }
    return t(keyMap[value] || value)
  }

  const getQ2Label = (value: string) => {
    const keyMap: Record<string, string> = {
      speed: "survey.q2.option1",
      trust: "survey.q2.option2",
      rare_efficiency: "survey.q2.option3",
      social: "survey.q2.option4"
    }
    return t(keyMap[value] || value)
  }

  const getQ3Label = (value: string) => {
    const keyMap: Record<string, string> = {
      chat: "survey.q3.option1",
      notify: "survey.q3.option2",
      review: "survey.q3.option3",
      history: "survey.q3.option4"
    }
    return t(keyMap[value] || value)
  }
  const [formData, setFormData] = useState<SurveyResponse>({
    q1_primary: "" as MatchingPrimaryPref,
    q2_values: [],
    q3_features: [],
    q4_intent: null,
  })

  const handleQ2Change = (value: Q2Value, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      q2_values: checked ? [...prev.q2_values, value] : prev.q2_values.filter((v) => v !== value),
    }))
  }

  const handleQ3Change = (value: Q3Feature, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      q3_features: checked ? [...prev.q3_features, value] : prev.q3_features.filter((v) => v !== value),
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.q1_primary) return false
    if (formData.q2_values.length === 0) return false
    if (formData.q3_features.length === 0) return false
    return true
  }

  const triggerConfetti = () => {
    const duration = Math.random() * 600 + 1200 // 1.2-1.8 seconds
    const end = Date.now() + duration

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: t("survey.incompleteError"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Survey submission failed")
      }

      // Trigger confetti animation
      triggerConfetti()

      // Set localStorage flag
      localStorage.setItem("matching_survey_done", "1")

      // Wait a bit for confetti, then call success callback
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      console.error("Survey submission error:", error)
      toast({
        title: t("survey.submitError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-full">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t("survey.title")}</h2>
            <p className="text-sm text-slate-600 mt-1">
              {t("survey.subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Q1 - Single choice, required */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">
              {t("survey.q1.title")} <span className="text-red-500">*</span>
            </h3>
            <RadioGroup
              value={formData.q1_primary}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, q1_primary: value as MatchingPrimaryPref }))}
            >
              {Q1_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`q1-${option.value}`} />
                  <Label htmlFor={`q1-${option.value}`} className="text-sm leading-relaxed">
                    {getQ1Label(option.value)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Q2 - Multiple choice, required */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">
              {t("survey.q2.title")} <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-3">
              {Q2_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`q2-${option.value}`}
                    checked={formData.q2_values.includes(option.value)}
                    onCheckedChange={(checked) => handleQ2Change(option.value, !!checked)}
                  />
                  <Label htmlFor={`q2-${option.value}`} className="text-sm leading-relaxed">
                    {getQ2Label(option.value)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Q3 - Multiple choice, required */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">
              {t("survey.q3.title")} <span className="text-red-500">*</span>
            </h3>
            <div className="space-y-3">
              {Q3_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`q3-${option.value}`}
                    checked={formData.q3_features.includes(option.value)}
                    onCheckedChange={(checked) => handleQ3Change(option.value, !!checked)}
                  />
                  <Label htmlFor={`q3-${option.value}`} className="text-sm leading-relaxed">
                    {getQ3Label(option.value)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Q4 - Single choice, optional */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t("survey.q4.title")}</h3>
            <RadioGroup
              value={formData.q4_intent?.toString() || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  q4_intent: value ? Number.parseInt(value) : null,
                }))
              }
            >
              {Q4_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value.toString()} id={`q4-${option.value}`} />
                  <Label htmlFor={`q4-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("common.buttons.sending") : t("common.buttons.send")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
