"use client"

import { prisma } from "@/lib/prisma"
import { useEffect, useState } from "react"
import AnimateNumber from "@number-flow/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Send,
  CheckCheck,
  Eye,
  Link,
  Reply,
  Mail,
} from "lucide-react"

interface CounterStat {
  icon: React.ElementType
  label: string
  value: number
  color: string
}

const ICONS: Record<string, React.ElementType> = {
  SentToday: Send,
  Delivered: CheckCheck,
  Opened: Eye,
  Clicked: Link,
  Replied: Reply,
  Bounced: Mail,
}

const COLORS: Record<string, string> = {
  SentToday: "text-blue-600",
  Delivered: "text-green-600",
  Opened: "text-purple-600",
  Clicked: "text-indigo-600",
  Replied: "text-emerald-600",
  Bounced: "text-red-600",
}

export function OutreachCounters() {
  const [stats, setStats] = useState<CounterStat[]>([
    { icon: Send, label: "Sent Today", value: 0, color: "text-blue-600" },
    { icon: CheckCheck, label: "Delivered", value: 0, color: "text-green-600" },
    { icon: Eye, label: "Opened", value: 0, color: "text-purple-600" },
    { icon: Link, label: "Clicked", value: 0, color: "text-indigo-600" },
    { icon: Reply, label: "Replied", value: 0, color: "text-emerald-600" },
    { icon: Mail, label: "Bounced", value: 0, color: "text-red-600" },
  ])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const today = new Date().toISOString().split("T")[0]
      const messages = await prisma.outreachMessage.findMany({
        where: {
          createdAt: { gte: new Date(today) },
        },
      })

      if (!cancelled) {
        const statuses = [
          "SENT",
          "DELIVERED",
          "OPENED",
          "CLICKED",
          "REPLIED",
          "BOUNCED",
        ] as const
        setStats(
          statuses.map((status) => ({
            icon: ICONS[status],
            label:
              status === "SENT" ? "Sent Today" : status.charAt(0) + status.slice(1).toLowerCase(),
            value: messages.filter((m) => m.status === status).length,
            color: COLORS[status],
          }))
        )
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <AnimateNumber
                value={stat.value}
                className="text-xl font-mono font-bold text-foreground"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}