import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "")}`,
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  try {
    const supabase = await createClient()

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=callback_error&message=${encodeURIComponent(exchangeError.message)}`,
      )
    }

    if (!data?.session) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_session`)
    }

    // リダイレクトURLの構築（codeパラメータなし）
    let redirectUrl: string

    // デプロイ環境でのリダイレクト処理
    const forwardedHost = request.headers.get("x-forwarded-host")
    const forwardedProto = request.headers.get("x-forwarded-proto")
    const isLocalEnv = process.env.NODE_ENV === "development"

    if (isLocalEnv) {
      redirectUrl = `${origin}${next}`
    } else if (forwardedHost) {
      const protocol = forwardedProto || "https"
      redirectUrl = `${protocol}://${forwardedHost}${next}`
    } else {
      // Vercelなどのデプロイ環境での処理
      const deployUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : origin
      redirectUrl = `${deployUrl}${next}`
    }

    // @supabase/ssrが自動的にCookieを処理するため、追加の処理は不要
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Auth callback error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unexpected error occurred"
    return NextResponse.redirect(
      `${origin}/auth/login?error=callback_error&message=${encodeURIComponent(errorMessage)}`,
    )
  }
}
