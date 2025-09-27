// 管理者セッション管理（クライアントサイド）
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

// クライアントサイドでのセッション管理
export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.success ? data.user : null
  } catch (error) {
    console.error("Authentication failed:", error)
    return null
  }
}

export async function logoutAdmin(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/logout", {
      method: "POST",
    })

    return response.ok
  } catch (error) {
    console.error("Logout failed:", error)
    return false
  }
}

export async function checkAdminSession(): Promise<AdminSession | null> {
  try {
    const response = await fetch("/api/admin/session", {
      method: "GET",
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.session || null
  } catch (error) {
    console.error("Session check failed:", error)
    return null
  }
}
