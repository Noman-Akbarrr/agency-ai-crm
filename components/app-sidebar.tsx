"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  UsersIcon,
  KanbanSquareIcon,
  SendIcon,
  SettingsIcon,
  ZapIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Admin",
    email: "admin@agency.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: true,
      items: [],
    },
    {
      title: "Leads",
      url: "/leads",
      icon: <UsersIcon />,
      items: [],
    },
    {
      title: "Pipeline",
      url: "/pipeline",
      icon: <KanbanSquareIcon />,
      items: [],
    },
    {
      title: "Outreach",
      url: "/outreach",
      icon: <SendIcon />,
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <SettingsIcon />,
      items: [],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ZapIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
            Agency CRM
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
