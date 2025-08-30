import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TradeOwnedListsManager from "@/components/trade-owned-lists/trade-owned-lists-manager"

interface List {
  id: number
  list_name: string
  card_ids: number[]
  created_at: string
  updated_at: string
  user_id: string
}

export default async function ListsPage() {
  const supabase = await createServerClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch user's lists
  const { data: lists, error } = await supabase
    .from("trade_owned_list")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching lists:", error)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">譲れるカードリスト</h1>
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-red-500 text-lg">リストの読み込みに失敗しました。</p>
              <p className="text-gray-600 mt-2">しばらく時間をおいて再度お試しください。</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <TradeOwnedListsManager initialLists={lists || []} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
