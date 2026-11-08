"use client"

import { prisma } from "@/lib/prisma"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, Mail, Phone, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QueuedMessage {
  id: string
  contactEmail: string
  contactName: string
  companyName: string
  subject: string
  status: string
  scheduledAt: Date | null
  timezone: string
  sequenceStep: number
}

export function ScheduledQueue() {
  const [messages, setMessages] = useState<QueuedMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const items = await prisma.outreachMessage.findMany({
        where: {
          status: { in: ["QUEUED", "SCHEDULED"] },
        },
        include: {
          contact: {
            include: { company: true },
          },
        },
        orderBy: { scheduledAt: "asc" },
        take: 20,
      })

      if (!cancelled) {
        setMessages(
          items.map((m) => ({
            id: m.id,
            contactEmail: m.contact.email,
            contactName: `${m.contact.firstName ?? ""} ${m.contact.lastName ?? ""}`.trim(),
            companyName: m.contact.company.name,
            subject: m.subject,
            status: m.status,
            scheduledAt: m.scheduledAt,
            timezone: m.contact.company.timezone,
            sequenceStep: m.sequenceStep,
          }))
        )
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm">Scheduled Queue</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex h-6 w-6 rounded-full border-2 border-border/60 border-t-primary animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const STATUS_BADGES: Record<string, string> = {
    QUEUED: "bg-yellow/10 text-yellow-900 border border-yellow/20",
    SCHEDULED: "bg-blue/10 text-blue-900 border border-blue/20",
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">Scheduled Queue</CardTitle>
        <Badge variant="outline" className="text-xs font-mono">
          {messages.length}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto border-t border-border/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-background/50">
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Company
                </th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subject
                </th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Step
                </th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Scheduled (Prospect TZ)
                </th>
                <th className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id} className="border-b border-border/60 hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-foreground truncate">
                        {m.contactName || m.contactEmail}
                      </span>
                    </div>
                    <div className="text-xs font-mono tabular-nums text-muted-foreground">
                      {m.contactEmail}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-foreground">
                    {m.companyName}
                  </td>
                  <td className="p-3 text-sm font-mono tabular-nums truncate max-w-xs">
                    {m.subject}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {m.sequenceStep}
                  </td>
                  <td className="p-3 text-sm text-right font-mono tabular-nums text-muted-foreground">
                    {m.scheduledAt
                      ? new Date(m.scheduledAt).toLocaleString("en-US", {
                        timeZone: m.timezone,
                        hour12: true,
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "—"}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="outline"
                      className={`text-xs font-mono ${STATUS_BADGES[m.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {m.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                    No scheduled messages.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}