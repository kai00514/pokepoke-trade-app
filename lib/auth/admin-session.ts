// 管理者セッション管理（クライアントサイド）
export interface AdminUser {
  userId: string
  username: string
  email: string
  name: string
}

export interface AdminSession {
  user: AdminUser
}

export async function checkAdminSession(): Promise<AdminSession | null> {
  try {
    const response = await fetch("/api/admin/session", {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data.session) {
      return null
    }

    return {
      user: data.session.user,
    }
  } catch (error) {
    console.error("Session check failed:", error)
    return null
  }
}
