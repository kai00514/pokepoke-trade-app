"use client"

import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"

interface TradeDetail404Props {
  message?: string
}

export default function TradeDetail404({ message = "投稿が見つかりません" }: TradeDetail404Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{message}</h1>
        <Button onClick={() => router.push("/")}>タイムラインに戻る</Button>
      </main>
      <Footer />
    </div>
  )
}
