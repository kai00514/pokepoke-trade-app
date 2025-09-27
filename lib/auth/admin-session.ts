// 管理者セッション管理（サーバーサイド）
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export interface AdminUser {
  id: string
  username: string
  email: string
  name: string
}

export interface AdminSession {
  user: AdminUser
  expiresAt: number
}

const SESSION_COOKIE_NAME = "admin_session"
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8時間

export async function createAdminSession(user: AdminUser): Promise<void> {
  const session: AdminSession = {
    user,
    expiresAt: Date.now() + SESSION_DURATION,
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/admin",
  })
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    const session: AdminSession = JSON.parse(sessionCookie.value)

    // セッション有効期限チェック
    if (Date.now() > session.expiresAt) {
      await clearAdminSession()
      return null
    }

    return session
  } catch (error) {
    console.error("Failed to get admin session:", error)
    return null
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("authenticate_admin", {
      p_username: username,
      p_password: password,
    })

    if (error) {
      console.error("Authentication error:", error)
      return null
    }

    if (data?.success) {
      return data.user as AdminUser
    }

    return null
  } catch (error) {
    console.error("Authentication failed:", error)
    return null
  }
}
