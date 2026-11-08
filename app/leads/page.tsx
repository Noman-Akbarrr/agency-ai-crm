"use client"

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { useState } from "react"

const TABS = [
  { value: "all", label: "All" },
  { value: "local_mx_passed", label: "MX Passed" },
  { value: "verified_ready", label: "Verified" },
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
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-border/60 bg-background flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <h2 className="font-semibold text-foreground shrink-0">Leads</h2>
          <Tabs
            value={selectedTab}
            onValueChange={handleTabChange}
          >
            <TabsList className="h-8">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-2 sm:px-3">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[420px]">
              <SheetHeader>
                <SheetTitle>Import CSV</SheetTitle>
              </SheetHeader>
              <CsvImporter />
            </SheetContent>
          </Sheet>
          <Button onClick={() => setInspectorOpen(true)} size="sm">
            <span className="hidden sm:inline">Open Inspector</span>
            <span className="sm:hidden">Inspector</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-2 sm:p-4">
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
