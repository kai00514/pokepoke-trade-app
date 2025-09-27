import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function checkAdminAuth() {
  const supabase = await createClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.user?.email) {
      redirect("/admin/login")
    }

    // 管理者権限チェック
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin_user", { user_email: session.user.email })

    if (adminError || !isAdmin) {
      redirect("/admin/login?error=unauthorized")
    }

    return {
      user: session.user,
      isAdmin: true,
    }
  } catch (error) {
    console.error("Admin auth check failed:", error)
    redirect("/admin/login?error=auth_failed")
  }
}

export async function getAdminSession() {
  const supabase = await createClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.email) {
      return null
    }

    // 管理者権限チェック
    const { data: isAdmin } = await supabase.rpc("is_admin_user", { user_email: session.user.email })

    if (!isAdmin) {
      return null
    }

    return {
      user: session.user,
      isAdmin: true,
    }
  } catch (error) {
    console.error("Get admin session failed:", error)
    return null
  }
}
