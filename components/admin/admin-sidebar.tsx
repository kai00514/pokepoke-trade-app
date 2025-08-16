"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { LayoutDashboard, FileText, Users, BarChart3, Settings, PenTool } from "lucide-react"

const menuItems = [
  {
    title: "ダッシュボード",
    url: "/admin",
    icon: LayoutDashboard,
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
    icon: FileText,
  },
  {
    title: "デッキ作成",
    url: "/admin/decks/create",
    icon: PenTool,
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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold">管理画面</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
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
    </Sidebar>
  )
}
