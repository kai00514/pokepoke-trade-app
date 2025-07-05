import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  console.log("🔄 Callback route called with:", {
    code: code ? "present" : "missing",
    next,
    error,
    errorDescription,
  })

  // エラーがある場合はエラーページにリダイレクト
  if (error) {
    console.error("❌ OAuth error:", error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "")}`,
    )
  }

  if (!code) {
    console.error("❌ No code parameter found")
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  try {
    const supabase = await createClient()

    console.log("🔄 Exchanging code for session...")
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("❌ Session exchange failed:", exchangeError)
      return NextResponse.redirect(
        `${origin}/auth/login?error=callback_error&message=${encodeURIComponent(exchangeError.message)}`,
      )
    }

    if (!data?.session) {
      console.error("❌ No session after exchange")
      return NextResponse.redirect(`${origin}/auth/login?error=no_session`)
    }

    console.log("✅ Session exchange successful for user:", data.session.user.email)

    // リダイレクトURLの構築
    let redirectUrl: string

    const forwardedHost = request.headers.get("x-forwarded-host")
    const forwardedProto = request.headers.get("x-forwarded-proto")
    const isLocalEnv = process.env.NODE_ENV === "development"

    if (isLocalEnv) {
      redirectUrl = `${origin}${next}`
    } else if (forwardedHost) {
      const protocol = forwardedProto || "https"
      redirectUrl = `${protocol}://${forwardedHost}${next}`
    } else {
      const deployUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : origin
      redirectUrl = `${deployUrl}${next}`
    }

    console.log("🔄 Redirecting to:", redirectUrl)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("❌ Unexpected callback error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unexpected error occurred"
    return NextResponse.redirect(
      `${origin}/auth/login?error=callback_error&message=${encodeURIComponent(errorMessage)}`,
    )
  }
}
