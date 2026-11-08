"use client"

import { prisma } from "@/lib/prisma"
import { LeadsTable } from "@/components/leads/leads-table"
import { CsvImporter } from "@/components/leads/csv-importer"
import { LeadInspector } from "@/components/leads/lead-inspector"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"
import { useState } from "react"

const TABS = [
  { value: "all", label: "All" },
  { value: "local_mx_passed", label: "Passed Local MX (Verify Next)" },
  { value: "verified_ready", label: "Verified & Ready" },
  { value: "suppressed", label: "Suppressed" },
] as const

type TabValue = (typeof TABS)[number]["value"]

export default function LeadsPage() {
  const [selectedTab, setSelectedTab] = useState<TabValue>("all")
  const handleTabChange = (value: string) => {
    setSelectedTab(value as TabValue)
  }
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [inspectorContactId, setInspectorContactId] = useState<string | null>(null)

  const statusFilter = (() => {
    switch (selectedTab) {
      case "local_mx_passed":
        return { verificationStatus: "LOCAL_MX_PASSED", isSuppressed: false }
      case "verified_ready":
        return { verificationStatus: "VALID", isSuppressed: false }
      case "suppressed":
        return { isSuppressed: true }
      default:
        return {}
    }
  })()

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border/60 bg-background/50 backdrop-blur flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground">Leads</h2>
          <Separator orientation="vertical" className="h-4" />
          <Tabs
            value={selectedTab}
            onValueChange={handleTabChange}
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-4">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Import CSV
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[420px]">
              <CsvImporter />
            </SheetContent>
          </Sheet>
          <Button onClick={() => setInspectorOpen(true)} size="sm">
            Open Inspector
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <LeadsTable
          filter={statusFilter}
          onContactSelect={setInspectorContactId}
          onOpenInspector={() => setInspectorOpen(true)}
        />
      </div>

      {/* Inspector Drawer */}
      <LeadInspector
        open={inspectorOpen}
        contactId={inspectorContactId}
        onOpenChange={setInspectorOpen}
      />
    </div>
  )
}