import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2, Calendar } from "lucide-react"
import Link from "next/link"

interface List {
  id: number
  name: string
  updated_at: string
  user_id: string
}

async function ListsContent() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: lists, error } = await supabase
    .from("trade_owned_list")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching lists:", error)
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Lists</h1>
        <p className="text-red-500">Error loading lists. Please try again.</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">譲れるカードリスト管理</h1>
        <Button asChild>
          <Link href="/lists/create">
            <Plus className="h-4 w-4 mr-2" />
            新しいリストを作成
          </Link>
        </Button>
      </div>

      {lists && lists.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{list.name}</CardTitle>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(list.updated_at)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">リスト #{list.id}</Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/lists/${list.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">リストがありません</h3>
            <p className="text-gray-500 mb-6">
              譲れるカードのリストを作成して、トレード投稿で簡単に選択できるようにしましょう。
            </p>
            <Button asChild>
              <Link href="/lists/create">
                <Plus className="h-4 w-4 mr-2" />
                最初のリストを作成
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ListsSkeleton() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function ListsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-white">
      <Header />
      <main className="flex-grow py-8">
        <Suspense fallback={<ListsSkeleton />}>
          <ListsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
