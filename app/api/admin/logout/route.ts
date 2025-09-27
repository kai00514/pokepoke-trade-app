import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME } from "@/constants"

export async function GET(request: Request) {
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/", // "/admin" から "/" に変更
  })

  return NextResponse.redirect(new URL("/admin/login", request.url))
}
