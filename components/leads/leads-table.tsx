"use client"

import {
  createCoreRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  useTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Mail } from "lucide-react"
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
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

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

  const columns: any = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }: any) => (
        <div className="font-mono text-xs tabular-nums text-foreground">
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Company",
      cell: ({ row }: any) => (
        <div className="text-xs font-medium text-foreground">
          {row.original.companyName}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }: any) => (
        <div className="text-xs text-muted-foreground">
          {row.original.role ?? "—"}
        </div>
      ),
    },
    {
      accessorKey: "verificationStatus",
      header: "Verification",
      cell: ({ row }: any) => (
        <BadgeStatus
          status={row.original.verificationStatus}
          isSuppressed={row.original.isSuppressed}
        />
      ),
    },
    {
      accessorKey: "stage",
      header: "Pipeline Stage",
      cell: ({ row }: any) => (
        <Badge variant="outline" className="text-xs font-mono tabular-nums">
          {row.original.stage}
        </Badge>
      ),
    },
    {
      accessorKey: "state",
      header: "State",
      cell: ({ row }: any) => (
        <div className="text-xs font-mono tabular-nums text-muted-foreground">
          {row.original.state ?? "—"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const id = row.original.id
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  onContactSelect(id)
                  onOpenInspector()
                }}
              >
                <Mail className="mr-2 h-4 w-4" /> View Contact
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onContactSelect(id)
                  onOpenInspector()
                }}
              >
                <Mail className="mr-2 h-4 w-4" /> Stage Next Step
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useTable({
    columns: columns as any,
    data,
    getCoreRowModel: createCoreRowModel(),
    getSortedRowModel: createSortedRowModel(),
    getFilteredRowModel: createFilteredRowModel(),
    getPaginatedRowModel: createPaginatedRowModel(),
    state: { sorting, pagination },
    onSortingChange: setSorting as any,
    onPaginationChange: setPagination as any,
  } as any)

  const pageRows = (table as any).getPaginatedRowModel().rows

  return (
    <div className="rounded-2xl border border-border/60 bg-background shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {(table as any).getHeaderGroups().map((headerGroup: any) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <th
                    key={header.id}
                    className="h-12 bg-background/50 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/60"
                    {...header.getHeaderProps()}
                  >
                    {header.isPlaceholder ? null : header.render()}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.map((row: any) => {
              return (
                <tr
                  key={row.id}
                  className="border-b border-border/60 hover:bg-muted/50 transition-colors group"
                  {...row.getRowProps()}
                >
                  {row.getVisibleCells().map((cell: any) => {
                    return (
                      <td
                        key={cell.id}
                        className="p-3 text-sm text-foreground align-top"
                        {...cell.getCellProps()}
                      >
                        {cell.render()}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {data.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-xs text-muted-foreground">No leads found.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex h-8 w-8 rounded-full border-2 border-border/60 border-t-primary animate-spin" />
        </div>
      )}
    </div>
  )
}