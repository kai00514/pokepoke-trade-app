import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const SESSION_COOKIE_NAME = "admin_session"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return NextResponse.redirect(new URL("/admin/login", request.url))
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }
}
