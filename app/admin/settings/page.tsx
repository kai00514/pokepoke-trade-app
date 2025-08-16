import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-slate-600">システムの設定を管理します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>システム設定</CardTitle>
          <CardDescription>サイト全体の設定を管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">設定機能は今後実装予定です。</p>
        </CardContent>
      </Card>
    </div>
  )
}
