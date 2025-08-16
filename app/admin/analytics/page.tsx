import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">分析</h1>
        <p className="text-slate-600">サイトの利用状況を分析します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>アクセス解析</CardTitle>
          <CardDescription>サイトのアクセス状況やユーザー行動を分析します</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">分析機能は今後実装予定です。</p>
        </CardContent>
      </Card>
    </div>
  )
}
