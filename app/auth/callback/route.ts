import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  console.log("=== DEBUG: Auth callback started ===")
  console.log("Code:", code ? "present" : "missing")
  console.log("Next:", next)
  console.log("Origin:", origin)

  if (code) {
    try {
      const supabase = await createClient()
      console.log("=== DEBUG: Supabase client created ===")

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.log("=== DEBUG: Code exchange result ===")
      console.log("Data:", data ? "present" : "missing")
      console.log("Error:", error)

      if (!error) {
        console.log("=== DEBUG: Code exchange successful ===")
        console.log("User:", data.user?.email)
        console.log("Session:", data.session ? "present" : "missing")

        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"

        console.log("=== DEBUG: Redirect info ===")
        console.log("Forwarded host:", forwardedHost)
        console.log("Is local env:", isLocalEnv)

        if (isLocalEnv) {
          const redirectUrl = `${origin}${next}`
          console.log("=== DEBUG: Local redirect to:", redirectUrl)
          return NextResponse.redirect(redirectUrl)
        } else if (forwardedHost) {
          const redirectUrl = `https://${forwardedHost}${next}`
          console.log("=== DEBUG: Production redirect to:", redirectUrl)
          return NextResponse.redirect(redirectUrl)
        } else {
          const redirectUrl = `${origin}${next}`
          console.log("=== DEBUG: Fallback redirect to:", redirectUrl)
          return NextResponse.redirect(redirectUrl)
        }
      } else {
        console.error("=== DEBUG: Code exchange failed ===")
        console.error("Error:", error)
      }
    } catch (error) {
      console.error("=== DEBUG: Exception in callback ===")
      console.error("Error:", error)
    }
  } else {
    console.log("=== DEBUG: No code provided ===")
  }

  // return the user to an error page with instructions
  const errorUrl = `${origin}/auth/auth-code-error`
  console.log("=== DEBUG: Redirecting to error page:", errorUrl)
  return NextResponse.redirect(errorUrl)
}
