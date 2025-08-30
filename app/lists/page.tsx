import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

interface List {
  id: number
  name: string
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
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Lists</h1>
        <p className="text-red-500">Error loading lists. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lists</h1>
      {lists && lists.length > 0 ? (
        <ul className="space-y-4">
          {lists.map((list: List) => (
            <li key={list.id} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{list.name}</h2>
              <p className="text-sm text-gray-500">
                {new Date(list.updated_at)
                  .toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .replace(/\//g, "/")
                  .replace(",", "")}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No lists found.</p>
      )}
    </div>
  )
}
