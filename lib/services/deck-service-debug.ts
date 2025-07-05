import { supabase } from "@/lib/supabase/client"

export async function testRpcConnection(): Promise<{ error: string | null; data?: any }> {
  console.log("🧪 Testing RPC connection...")
  try {
    console.log("🧪 Testing simple function...")
    const { data: testData, error: testError } = await supabase.rpc("test_function")
    if (testError) return { error: `Simple function failed: ${testError.message}` }
    console.log("🧪 Testing function with parameter...")
    const { data: paramData, error: paramError } = await supabase.rpc("test_with_param", { test_input: "Hello World" })
    if (paramError) return { error: `Parameter function failed: ${paramError.message}` }
    return { error: null, data: { testData, paramData } }
  } catch (err) {
    console.error("🧪 Exception during RPC test:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function testLikeDeck(deckId: string): Promise<{ error: string | null; data?: any }> {
  console.log("👍 Testing likeDeck with deckId:", deckId)
  try {
    console.log("👍 Checking if deck exists...")
    const { error: deckError } = await supabase.from("decks").select("id, like_count").eq("id", deckId).single()
    if (deckError) return { error: `Deck not found: ${deckError.message}` }
    console.log("👍 Calling increment_deck_likes RPC...")
    const { data: rpcData, error: rpcError } = await supabase.rpc("increment_deck_likes", { deck_id_input: deckId })
    if (rpcError) return { error: `RPC failed: ${rpcError.message}` }
    return { error: null, data: rpcData }
  } catch (err) {
    console.error("👍 Exception during likeDeck test:", err)
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}
