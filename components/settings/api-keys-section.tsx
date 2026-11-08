"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Key, Mail, Zap, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

interface ApiKeys {
  zeroBounceApiKey: string | null
  resendApiKey: string | null
  agentApiKey: string | null
}

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKeys | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showZeroBounce, setShowZeroBounce] = useState(false)
  const [showResend, setShowResend] = useState(false)

  // Local edit state
  const [zeroBounceValue, setZeroBounceValue] = useState("")
  const [resendValue, setResendValue] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      const res = await fetch("/api/settings/keys", {
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        const data = await res.json()
        if (!cancelled) {
          setKeys(data)
          setZeroBounceValue(data.zeroBounceApiKey ?? "")
          setResendValue(data.resendApiKey ?? "")
        }
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zeroBounceApiKey: zeroBounceValue || null,
          resendApiKey: resendValue || null,
        }),
      })

      if (res.ok) {
        toast.success("API keys saved")
      } else {
        toast.error("Failed to save API keys")
      }
    } catch (err) {
      toast.error("Failed to save API keys")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !keys) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm">API Keys</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex h-6 w-6 rounded-full border-2 border-border/60 border-t-primary animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const maskKey = (key: string | null) => {
    if (!key) return "Not set"
    if (key.length <= 8) return "••••••••"
    return "••••••••" + key.slice(-4)
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-sm">API Keys</CardTitle>
        <p className="text-xs text-muted-foreground">
          Third-party service credentials and agent access
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ZeroBounce */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Key className="h-3 w-3 text-muted-foreground" />
            <Label className="text-sm font-medium">ZeroBounce API Key</Label>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Used for Stage-2 email verification (human-triggered only)
          </p>
          <div className="flex gap-2">
            <Input
              type={showZeroBounce ? "text" : "password"}
              value={zeroBounceValue}
              onChange={(e) => setZeroBounceValue(e.target.value)}
              placeholder="sk-live-..."
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowZeroBounce(!showZeroBounce)}
            >
              {showZeroBounce ? "Hide" : "Show"}
            </Button>
          </div>
          {keys.zeroBounceApiKey && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Configured: {maskKey(keys.zeroBounceApiKey)}
            </p>
          )}
        </div>

        <Separator />

        {/* Resend */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <Label className="text-sm font-medium">Resend API Key</Label>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Used for sending outreach emails
          </p>
          <div className="flex gap-2">
            <Input
              type={showResend ? "text" : "password"}
              value={resendValue}
              onChange={(e) => setResendValue(e.target.value)}
              placeholder="re_..."
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowResend(!showResend)}
            >
              {showResend ? "Hide" : "Show"}
            </Button>
          </div>
          {keys.resendApiKey && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Configured: {maskKey(keys.resendApiKey)}
            </p>
          )}
        </div>

        <Separator />

        {/* Agent API Key */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3 w-3 text-muted-foreground" />
            <Label className="text-sm font-medium">Agent API Key</Label>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Protects /api/agent/* endpoints for MCP integration
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              defaultValue={keys.agentApiKey ?? ""}
              readOnly
              className="flex-1 bg-muted/50"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(keys.agentApiKey ?? "")
                toast.success("Copied to clipboard")
              }}
            >
              Copy
            </Button>
          </div>
          {keys.agentApiKey && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Configured: {maskKey(keys.agentApiKey)}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Send this header with agent requests:{" "}
            <code className="font-mono text-xs">x-agent-api-key</code>
          </p>
        </div>

        <div className="pt-2">
          <Button type="button" onClick={handleSave} disabled={saving} className="w-auto">
            {saving ? "Saving..." : "Save API Keys"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}