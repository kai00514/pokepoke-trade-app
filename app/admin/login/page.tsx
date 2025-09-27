"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Shield } from "lucide-react"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        // ログイン成功時に管理画面にリダイレクト
        window.location.href = "/admin"
      } else {
        setError(data.error || "ログインに失敗しました")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("サーバーエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">管理者ログイン</CardTitle>
          <CardDescription>管理画面にアクセスするには認証が必要です</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1"
                placeholder="ユーザー名を入力"
              />
            </div>

            <div>
              <Label htmlFor="password">パスワード</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  placeholder="パスワードを入力"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
