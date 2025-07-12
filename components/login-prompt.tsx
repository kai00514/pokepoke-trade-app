import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface LoginPromptProps {
  className?: string
}

export function LoginPrompt({ className }: LoginPromptProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-4", className)}>
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>ログインが必要です</CardTitle>
          <CardDescription>この機能を利用するにはログインしてください。</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">お気に入り機能のご利用には、会員登録またはログインが必要です。</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/auth/login" className="w-full">
            <Button className="w-full">ログイン</Button>
          </Link>
          <Link href="/auth/signup" className="w-full">
            <Button variant="outline" className="w-full bg-transparent">
              新規登録
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
