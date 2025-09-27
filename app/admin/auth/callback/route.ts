import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/admin"

  if (code) {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Auth callback error:", error)
        return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`)
      }

      if (!data.user?.email) {
        return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`)
      }

      // 管理者権限チェック
      const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin_user", { user_email: data.user.email })

      if (adminError || !isAdmin) {
        // 管理者権限がない場合はログアウトして拒否
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`)
      }

      // 管理者の場合は管理画面にリダイレクト
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error("Unexpected auth callback error:", error)
      return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`)
    }
  }

  // コードがない場合はログインページにリダイレクト
  return NextResponse.redirect(`${origin}/admin/login`)
}
