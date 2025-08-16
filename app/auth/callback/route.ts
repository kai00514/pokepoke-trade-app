import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("🔍 [AUTH CALLBACK] Starting callback processing")

  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/"

    console.log("🔍 [AUTH CALLBACK] URL params:", {
      origin,
      code: code ? `${code.substring(0, 10)}...` : null,
      next,
      fullUrl: request.url,
    })

    if (code) {
      console.log("🔍 [AUTH CALLBACK] Code found, creating Supabase client...")

      let supabase
      try {
        supabase = await createClient()
        console.log("✅ [AUTH CALLBACK] Supabase client created successfully")
      } catch (clientError) {
        console.error("❌ [AUTH CALLBACK] Failed to create Supabase client:", clientError)
        throw new Error(`Supabase client creation failed: ${clientError}`)
      }

      console.log("🔍 [AUTH CALLBACK] Attempting to exchange code for session...")

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        console.log("🔍 [AUTH CALLBACK] Exchange result:", {
          hasData: !!data,
          hasSession: !!data?.session,
          hasUser: !!data?.user,
          userId: data?.user?.id,
          userEmail: data?.user?.email,
          error: error
            ? {
                message: error.message,
                status: error.status,
                details: error,
              }
            : null,
        })

        if (!error) {
          console.log("✅ [AUTH CALLBACK] Session exchange successful")

          const forwardedHost = request.headers.get("x-forwarded-host")
          const isLocalEnv = process.env.NODE_ENV === "development"

          console.log("🔍 [AUTH CALLBACK] Redirect info:", {
            forwardedHost,
            isLocalEnv,
            nodeEnv: process.env.NODE_ENV,
          })

          let redirectUrl
          if (isLocalEnv) {
            redirectUrl = `${origin}${next}`
            console.log("🔍 [AUTH CALLBACK] Local redirect:", redirectUrl)
          } else if (forwardedHost) {
            redirectUrl = `https://${forwardedHost}${next}`
            console.log("🔍 [AUTH CALLBACK] Forwarded host redirect:", redirectUrl)
          } else {
            redirectUrl = `${origin}${next}`
            console.log("🔍 [AUTH CALLBACK] Origin redirect:", redirectUrl)
          }

          console.log("✅ [AUTH CALLBACK] Redirecting to:", redirectUrl)
          return NextResponse.redirect(redirectUrl)
        } else {
          console.error("❌ [AUTH CALLBACK] Session exchange failed:", error)
          throw new Error(`Session exchange failed: ${error.message}`)
        }
      } catch (exchangeError) {
        console.error("❌ [AUTH CALLBACK] Exception during session exchange:", exchangeError)
        throw exchangeError
      }
    } else {
      console.log("⚠️ [AUTH CALLBACK] No code parameter found")
    }

    // return the user to an error page with instructions
    const errorUrl = `${origin}/auth/auth-code-error`
    console.log("🔍 [AUTH CALLBACK] Redirecting to error page:", errorUrl)
    return NextResponse.redirect(errorUrl)
  } catch (error) {
    console.error("❌ [AUTH CALLBACK] Fatal error in callback processing:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error,
    })

    // Return a proper error response instead of letting it crash
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error during authentication callback",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
