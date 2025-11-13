"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import CollagePreview from "@/components/collage/collage-preview"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { CollageData } from "@/types/collage"

export default function CollageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const collageId = params.id as string

  const [collage, setCollage] = useState<CollageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [ogImageUrl, setOgImageUrl] = useState("")

  useEffect(() => {
    const fetchCollage = async () => {
      try {
        const response = await fetch(`/api/collages/${collageId}`)
        if (!response.ok) throw new Error("Failed to fetch collage")
        const data = await response.json()
        setCollage(data)
        setOgImageUrl(`/api/collages/${collageId}/opengraph-image`)
      } catch (error) {
        console.error("Error fetching collage:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCollage()
  }, [collageId])

  const handleShare = () => {
    const url = `${window.location.origin}/collages/${collageId}`
    const shareUrl = `https://x.com/intent/post?url=${encodeURIComponent(url)}`
    window.open(shareUrl, "_blank")
  }

  const handleReselect = () => {
    router.push("/collages")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!collage) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">コラージュが見つかりません</p>
            <Button onClick={() => router.push("/collages")} className="bg-blue-600 hover:bg-blue-700">
              一覧に戻る
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/collages"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            コラージュ一覧に戻る
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{collage.title1}</h1>
              <p className="text-gray-600 mt-2">
                {collage.card_ids_1.length} + {collage.card_ids_2.length}枚のカード
              </p>
            </div>

            <CollagePreview
              collageId={collageId}
              collageImageUrl={ogImageUrl}
              onReselect={handleReselect}
              onShare={handleShare}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
