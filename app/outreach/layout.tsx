import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

export default function OutreachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 sm:h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-3 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 sm:mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold text-foreground truncate">Outreach</h1>
            <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
              Command Center
            </Badge>
          </div>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
