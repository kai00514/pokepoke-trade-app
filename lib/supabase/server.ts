import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  console.log("🔍 [SUPABASE SERVER] Starting client creation")

  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("🔍 [SUPABASE SERVER] Environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : "undefined",
      keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + "..." : "undefined",
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(`Missing environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseAnonKey}`)
    }

    console.log("🔍 [SUPABASE SERVER] Getting cookies...")
    let cookieStore
    try {
      cookieStore = await cookies()
      console.log("✅ [SUPABASE SERVER] Cookies retrieved successfully")
    } catch (cookieError) {
      console.error("❌ [SUPABASE SERVER] Failed to get cookies:", cookieError)
      throw new Error(`Cookie retrieval failed: ${cookieError}`)
    }

    console.log("🔍 [SUPABASE SERVER] Creating server client...")

    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          try {
            const allCookies = cookieStore.getAll()
            console.log("🔍 [SUPABASE SERVER] Retrieved cookies:", {
              count: allCookies.length,
              names: allCookies.map((c) => c.name),
            })
            return allCookies
          } catch (error) {
            console.error("❌ [SUPABASE SERVER] Error in getAll cookies:", error)
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            console.log("🔍 [SUPABASE SERVER] Setting cookies:", {
              count: cookiesToSet.length,
              cookies: cookiesToSet.map((c) => ({ name: c.name, hasValue: !!c.value })),
            })

            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch (setCookieError) {
                console.error(`❌ [SUPABASE SERVER] Failed to set cookie ${name}:`, setCookieError)
              }
            })
            console.log("✅ [SUPABASE SERVER] Cookies set successfully")
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be safely ignored as cookies will be set by the client-side auth flow.
            console.warn("⚠️ [SUPABASE SERVER] Cookie setAll failed in server component:", error)
          }
        },
      },
    })

    console.log("✅ [SUPABASE SERVER] Server client created successfully")
    return client
  } catch (error) {
    console.error("❌ [SUPABASE SERVER] Fatal error creating client:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error,
    })
    throw error
  }
}

// Alias for compatibility
export { createClient as createServerClient }
