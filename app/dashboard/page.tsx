"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  BanIcon,
  SendIcon,
  MessageSquareIcon,
  TrophyIcon,
  ZapIcon,
  ArrowRightIcon,
  RefreshCwIcon,
} from "lucide-react"

interface DashboardStats {
  totalContacts: number
  verifiedReady: number
  localMxPassed: number
  suppressed: number
  contacted: number
  replied: number
  qualified: number
  outreachToday: number
  dailyLimit: number
  emailsSentToday: number
  quotaRemaining: number
  senderName: string
  senderEmail: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/dashboard/stats")
      const json = await res.json()
      if (json.success) {
        setStats(json.data)
      } else {
        setError(json.error || "Failed to load stats")
      }
    } catch {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <BanIcon className="h-5 w-5" /> Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchStats} variant="outline" size="sm">
              <RefreshCwIcon className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: "Total Contacts",
      value: stats.totalContacts,
      icon: UsersIcon,
      description: "All leads in database",
    },
    {
      title: "Verified & Ready",
      value: stats.verifiedReady,
      icon: CheckCircleIcon,
      description: "Ready for outreach",
      accent: "text-green-600",
    },
    {
      title: "Awaiting Verification",
      value: stats.localMxPassed,
      icon: ClockIcon,
      description: "Local MX passed, need ZeroBounce",
      accent: "text-amber-600",
    },
    {
      title: "Suppressed",
      value: stats.suppressed,
      icon: BanIcon,
      description: "Opted out or invalid",
      accent: "text-red-500",
    },
    {
      title: "Contacted",
      value: stats.contacted,
      icon: SendIcon,
      description: "In outreach sequence",
      accent: "text-blue-600",
    },
    {
      title: "Replied",
      value: stats.replied,
      icon: MessageSquareIcon,
      description: "Responded to outreach",
      accent: "text-purple-600",
    },
    {
      title: "Qualified",
      value: stats.qualified,
      icon: TrophyIcon,
      description: "Hot leads ready to close",
      accent: "text-emerald-600",
    },
    {
      title: "Sent Today",
      value: `${stats.outreachToday}/${stats.dailyLimit}`,
      icon: ZapIcon,
      description: `${stats.quotaRemaining} quota remaining`,
      accent: "text-orange-500",
    },
  ]

  const quickActions = [
    { label: "Import CSV Leads", href: "/leads", icon: UsersIcon },
    { label: "View Pipeline", href: "/pipeline", icon: SendIcon },
    { label: "Outreach Center", href: "/outreach", icon: MessageSquareIcon },
    { label: "Settings", href: "/settings", icon: ZapIcon },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Welcome back, {stats.senderName}. Here&apos;s your outreach overview.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCwIcon className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.accent || "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Quota Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ZapIcon className="h-4 w-4 text-orange-500" />
            Daily Send Quota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {stats.emailsSentToday} of {stats.dailyLimit} emails sent today
              </span>
              <Badge variant={stats.quotaRemaining > 0 ? "outline" : "destructive"}>
                {stats.quotaRemaining} remaining
              </Badge>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (stats.emailsSentToday / stats.dailyLimit) * 100)}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10">
                    <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.label}</p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Sender Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sender Identity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-semibold text-primary">
                {stats.senderName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{stats.senderName}</p>
              <p className="text-xs text-muted-foreground font-mono">{stats.senderEmail}</p>
            </div>
            <Link href="/settings" className="ml-auto">
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
