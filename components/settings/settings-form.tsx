"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Shield, Clock, Users } from "lucide-react"
import { toast } from "sonner"

interface SystemConfig {
  id: string
  dailySendLimit: number
  emailsSentToday: number
  lastQuotaResetDate: string
  senderName: string
  senderEmail: string
}

export function SettingsForm() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state (local edits until saved)
  const [dailySendLimit, setDailySendLimit] = useState("")
  const [senderName, setSenderName] = useState("")
  const [senderEmail, setSenderEmail] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      const res = await fetch("/api/settings/config", {
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const data = await res.json()
        if (!cancelled) {
          setConfig(data)
          setDailySendLimit(data.dailySendLimit.toString())
          setSenderName(data.senderName)
          setSenderEmail(data.senderEmail)
        }
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailySendLimit: parseInt(dailySendLimit, 10),
          senderName,
          senderEmail,
        }),
      })

      if (res.ok) {
        toast.success("Settings saved")
      } else {
        toast.error("Failed to save settings")
      }
    } catch (err) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm">General Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex h-6 w-6 rounded-full border-2 border-border/60 border-t-primary animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-sm">General Settings</CardTitle>
        <p className="text-xs text-muted-foreground">
          Daily sending limits and sender identity
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Daily Send Limit</Label>
              <Input
                type="number"
                value={dailySendLimit}
                onChange={(e) => setDailySendLimit(e.target.value)}
                placeholder="50"
              />
              <p className="text-[10px] text-muted-foreground">
                Maximum emails sent per 24 hours
              </p>
            </div>
            <div className="space-y-2">
              <Label>Sender Name</Label>
              <Input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Founder"
              />
              <p className="text-[10px] text-muted-foreground">
                Appears as the "From" name
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sender Email</Label>
            <Input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="outreach@yourdomain.com"
            />
            <p className="text-[10px] text-muted-foreground">
              Must be verified in Resend
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>
                Quota resets daily at UTC midnight.{" "}
                <span className="font-mono">
                  {config.emailsSentToday}/{config.dailySendLimit}
                </span>
                sent today
              </span>
            </div>
            <Button type="submit" disabled={saving} className="w-auto">
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}