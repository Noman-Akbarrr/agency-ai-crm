"use client"

import { prisma } from "@/lib/prisma"
import { useEffect, useState } from "react"
import {
  DndContext,
  closestCorners,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STAGE_COLORS: Record<string, string> = {
  NEW_SCRAPE: "bg-muted",
  LOCAL_FILTERED: "bg-blue/10",
  READY_FOR_OUTREACH: "bg-green/10",
  CONTACTED: "bg-purple/10",
  ENGAGED: "bg-orange/10",
  REPLIED: "bg-indigo/10",
  QUALIFIED: "bg-emerald/10",
  DISQUALIFIED: "bg-red/10",
}

interface LeadCard {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  companyName: string
  role: string | null
  stage: string
  verificationStatus: string
  companyId: string
}

export function KanbanBoard({
  stages,
}: {
  stages: Array<{ id: string; label: string }>
}) {
  const [columns, setColumns] = useState<
    Array<{ id: string; label: string; leads: LeadCard[] }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const contacts = await prisma.contact.findMany({
        include: { company: true },
        orderBy: { createdAt: "asc" },
      })
      if (!cancelled) {
        const cols = stages.map((s) => ({
          id: s.id,
          label: s.label,
          leads: contacts
            .filter((c) => c.company.stage === s.id)
            .map((c) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              email: c.email,
              companyName: c.company.name,
              role: c.role,
              stage: c.company.stage,
              verificationStatus: c.verificationStatus,
              companyId: c.companyId,
            })),
        }))
        setColumns(cols)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [JSON.stringify(stages)])

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = async (
    event: { active: { id: string }; over: { id: string } | null }
  ) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Find which column the active lead is in
    let activeColumnId: string | null = null
    let leadIndex = -1
    let lead: LeadCard | null = null

    for (const col of columns) {
      const idx = col.leads.findIndex((l) => l.id === active.id)
      if (idx !== -1) {
        activeColumnId = col.id
        leadIndex = idx
        lead = col.leads[idx]
        break
      }
    }

    if (!lead || !activeColumnId) return

    // Find which column the lead is being dropped on (by matching over.id to a lead id in some column)
    let targetColumnId: string | null = null
    for (const col of columns) {
      if (col.leads.some((l) => l.id === over.id)) {
        targetColumnId = col.id
        break
      }
    }

    if (!targetColumnId || targetColumnId === activeColumnId) return

    // Update local state
    const newColumns = columns.map((c) => {
      if (c.id === activeColumnId) {
        return {
          ...c,
          leads: c.leads.filter((l) => l.id !== active.id),
        }
      }
      if (c.id === targetColumnId) {
        return { ...c, leads: [...c.leads, lead] }
      }
      return c
    })

    setColumns(newColumns)

    // Update database: move the company (and all its contacts) to the new stage
    try {
      await prisma.company.update({
        where: { id: lead.companyId },
        data: { stage: targetColumnId as any },
      })
    } catch (err) {
      console.error("Failed to update stage:", err)
      setColumns(columns) // revert
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex h-8 w-8 rounded-full border-2 border-border/60 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}>
      <div className="flex gap-3 h-full px-2">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col gap-3 w-[320px] flex-shrink-0"
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-border/60 bg-background/50">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${STAGE_COLORS[column.id] ?? "bg-muted"}`}
                />
                <span className="text-sm font-medium text-foreground">
                  {column.label}
                </span>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {column.leads.length}
              </Badge>
            </div>

            <SortableContext
              items={column.leads.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 p-2 min-h-[200px]">
                {column.leads.map((lead) => (
                  <SortableLeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>

      <DragOverlay>
        <div className="p-3 border rounded-xl shadow-lg bg-background">
          <p className="text-sm text-foreground">Moving lead...</p>
        </div>
      </DragOverlay>
    </DndContext>
  )
}

function SortableLeadCard({ lead }: { lead: LeadCard }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="rounded-lg border border-border/60 bg-background p-3 shadow-sm cursor-pointer transition-all hover:shadow-md group"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`h-2 w-2 rounded-full ${STAGE_COLORS[lead.stage] ?? "bg-muted"}`}
        />
        <Badge variant="outline" className="text-xs font-mono">
          {lead.verificationStatus}
        </Badge>
      </div>
      <div className="text-sm font-medium text-foreground truncate">
        {lead.firstName || ""} {lead.lastName || ""}
      </div>
      <div className="text-xs font-mono tabular-nums text-muted-foreground truncate">
        {lead.email}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {lead.companyName}
      </div>
      {lead.role && (
        <div className="text-xs text-muted-foreground">{lead.role}</div>
      )}
    </div>
  )
}