"use client"

import { FileText, Home, LogOut, Settings, Shield, Trophy, Users, BarChart3, PenTool, Layers, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { logoutAdmin } from "@/lib/auth/admin-session"

const menuItems = [
  {
    title: "ダッシュボード",
    url: "/admin",
    icon: Home,
  },
  {
    title: "記事管理",
    url: "/admin/articles",
    icon: FileText,
  },
  {
    title: "記事作成",
    url: "/admin/articles/create",
    icon: PenTool,
  },
  {
    title: "デッキ管理",
    url: "/admin/decks",
    icon: Layers,
  },
  {
    title: "デッキ作成",
    url: "/admin/decks/create",
    icon: Plus,
  },
  {
    title: "トーナメント",
    url: "/admin/tournaments",
    icon: Trophy,
  },
  {
    title: "ユーザー管理",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "分析",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "設定",
    url: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logoutAdmin()
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <span className="font-semibold text-lg">管理画面</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          ログアウト
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
