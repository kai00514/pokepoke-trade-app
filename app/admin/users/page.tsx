import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ユーザー管理</h1>
        <p className="text-slate-600">登録ユーザーの管理を行います</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
          <CardDescription>システムに登録されているユーザーの一覧です</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">ユーザー管理機能は今後実装予定です。</p>
        </CardContent>
      </Card>
    </div>
  )
}
