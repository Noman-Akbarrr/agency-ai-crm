"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronUp, Mail, MoreHorizontal } from "lucide-react"
import { BadgeStatus } from "@/components/leads/badge-status"

export interface LeadRow {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string | null
  companyName: string
  industry: string | null
  state: string | null
  verificationStatus: string
  mxRecordsFound: boolean
  isSuppressed: boolean
  stage: string
  createdAt: string
}

type SortDirection = "asc" | "desc" | null

interface ColumnDef {
  accessorKey: string
  header: string
  sortable?: boolean
  hideOnMobile?: boolean
}

export function LeadsTable({
  filter,
  onContactSelect,
  onOpenInspector,
}: {
  filter: Record<string, unknown>
  onContactSelect: (id: string | null) => void
  onOpenInspector: () => void
}) {
  const [data, setData] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<{ id: string; dir: SortDirection }>({
    id: "createdAt",
    dir: "desc",
  })
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 25

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const queryParams = new URLSearchParams()
        if (filter.verificationStatus) {
          queryParams.set("verificationStatus", filter.verificationStatus as string)
        }
        if (filter.isSuppressed !== undefined) {
          queryParams.set("isSuppressed", String(filter.isSuppressed))
        }
        const res = await fetch(`/api/leads?${queryParams.toString()}`, {
          headers: { "Content-Type": "application/json" },
        })
        const result = await res.json()
        if (!cancelled && result.success) {
          setData(result.data)
        }
      } catch (err) {
        console.error("Failed to load leads:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [JSON.stringify(filter)])

  const columns: ColumnDef[] = [
    { accessorKey: "email", header: "Email", sortable: true },
    { accessorKey: "companyName", header: "Company", sortable: true },
    { accessorKey: "role", header: "Role", sortable: true, hideOnMobile: true },
    { accessorKey: "verificationStatus", header: "Verification", sortable: true },
    { accessorKey: "stage", header: "Stage", sortable: true },
    { accessorKey: "state", header: "State", sortable: true, hideOnMobile: true },
    { accessorKey: "actions", header: "Actions", sortable: false },
  ]

  const sortedData = useMemo(() => {
    if (!sort.dir || sort.id === "actions") return data
    return [...data].sort((a, b) => {
      const av = (a as any)[sort.id] ?? ""
      const bv = (b as any)[sort.id] ?? ""
      if (av < bv) return sort.dir === "asc" ? -1 : 1
      if (av > bv) return sort.dir === "asc" ? 1 : -1
      return 0
    })
  }, [data, sort])

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const pageRows = sortedData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const handleSort = useCallback(
    (id: string) => {
      setSort((prev) => {
        if (prev.id !== id) return { id, dir: "asc" }
        if (prev.dir === "asc") return { id, dir: "desc" }
        return { id, dir: null }
      })
    },
    []
  )

  const firstName = (r: LeadRow) => `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "—"

  return (
    <div className="rounded-2xl border border-border/60 bg-background shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.accessorKey}
                  className={`h-10 sm:h-12 bg-background/50 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/60 p-2 sm:p-3 cursor-default ${col.hideOnMobile ? "hidden md:table-cell" : ""} ${col.sortable ? "cursor-pointer hover:bg-muted/30" : ""}`}
                  onClick={() => col.sortable && handleSort(col.accessorKey)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sort.id === col.accessorKey && (
                      <span className="ml-1 text-xs">
                        {sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/60 hover:bg-muted/50 transition-colors group"
              >
                <td className="p-2 sm:p-3 text-sm text-foreground align-top">
                  <div className="font-mono text-xs tabular-nums">{row.email}</div>
                </td>
                <td className="p-2 sm:p-3 text-sm text-foreground align-top">
                  <div className="text-xs font-medium">{row.companyName}</div>
                </td>
                <td className="p-2 sm:p-3 text-sm text-foreground align-top hidden md:table-cell">
                  <div className="text-xs">{row.role ?? "—"}</div>
                </td>
                <td className="p-2 sm:p-3 text-sm text-foreground align-top">
                  <BadgeStatus
                    status={row.verificationStatus}
                    isSuppressed={row.isSuppressed}
                  />
                </td>
                <td className="p-2 sm:p-3 text-sm text-foreground align-top">
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-mono tabular-nums">
                    {row.stage}
                  </Badge>
                </td>
                <td className="p-2 sm:p-3 text-sm text-foreground align-top hidden md:table-cell">
                  <div className="text-xs font-mono tabular-nums text-muted-foreground">
                    {row.state ?? "—"}
                  </div>
                </td>
                <td className="p-2 sm:p-3 text-sm align-top">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          onContactSelect(row.id)
                          onOpenInspector()
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" /> View Contact
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          onContactSelect(row.id)
                          onOpenInspector()
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" /> Stage Next Step
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-12 text-center text-xs text-muted-foreground"
                >
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/60 bg-background/50 p-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {pageRows.length > 0 ? pageIndex * pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min((pageIndex + 1) * pageSize, sortedData.length)}
          </span>{" "}
          of <span className="font-medium">{sortedData.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          >
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            {pageIndex + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex h-8 w-8 rounded-full border-2 border-border/60 border-t-primary animate-spin" />
        </div>
      )}
    </div>
  )
}
