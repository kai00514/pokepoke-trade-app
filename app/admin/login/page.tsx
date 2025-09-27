"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const authenticateAdmin = async (username: string, password: string) => {
  // Placeholder for admin authentication logic
  return null
}

const LoginPage = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const user = await authenticateAdmin(username, password)

      if (user) {
        toast.success("ログインしました")
        // ログイン成功時に /admin にリダイレクト
        window.location.href = "/admin"
      } else {
        setError("ユーザー名またはパスワードが正しくありません")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("ログインに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2>管理者ログイン</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">ユーザー名:</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password">パスワード:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
