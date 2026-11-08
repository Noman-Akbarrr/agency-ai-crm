"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Edit2, Check, X, Clock } from "lucide-react"
import { CardFooter } from "@/components/ui/card"

interface DraftMessage {
  id: string
  contactEmail: string
  contactName: string
  companyName: string
  subject: string
  bodyHtml: string
  bodyText: string
  status: string
  sequenceStep: number
  aiPersonalizationHook: string | null
}

export function DraftApproval() {
  const [drafts, setDrafts] = useState<DraftMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDraft, setSelectedDraft] = useState<DraftMessage | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/outreach/drafts", {
          headers: { "Content-Type": "application/json" },
        })
        const data = await res.json()
        if (!cancelled && data.success) {
          setDrafts(data.data)
        }
      } catch (err) {
        console.error("Failed to load drafts:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch("/api/outreach/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "QUEUED" }),
      })
      if (res.ok) {
        setDrafts(drafts.filter((d) => d.id !== id))
        if (selectedDraft?.id === id) setSelectedDraft(null)
      } else {
        console.error("Failed to approve draft")
      }
    } catch (err) {
      console.error("Failed to approve:", err)
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch("/api/outreach/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "CANCELLED" }),
      })
      if (res.ok) {
        setDrafts(drafts.filter((d) => d.id !== id))
        if (selectedDraft?.id === id) setSelectedDraft(null)
      } else {
        console.error("Failed to reject draft")
      }
    } catch (err) {
      console.error("Failed to reject:", err)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm">AI Draft Approval</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex h-6 w-6 rounded-full border-2 border-border/60 border-t-primary animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">AI Draft Approval</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {drafts.length}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto border-r border-border/60 p-3">
            {drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground">
                No drafts pending approval.
              </div>
            ) : (
              <div className="space-y-2">
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDraft(d)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                      selectedDraft?.id === d.id
                        ? "border-primary bg-muted/30"
                        : "border-border/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">
                        {d.contactName || d.contactEmail}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        Step {d.sequenceStep}
                      </Badge>
                    </div>
                    <div className="text-xs font-mono tabular-nums text-muted-foreground truncate">
                      {d.subject}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {d.companyName}
                    </div>
                    {d.aiPersonalizationHook && (
                      <div className="mt-2 text-[10px] text-muted-foreground italic">
                        "Hook: {d.aiPersonalizationHook}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedDraft && (
            <div className="flex-1 border-t border-border/60 flex flex-col">
              <div className="p-3 border-b border-border/60 bg-background/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    Reviewing: {selectedDraft.contactName || selectedDraft.contactEmail}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(selectedDraft.id)}
                >
                  <X className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
              <Separator />
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Subject
                </div>
                <div className="text-sm font-medium text-foreground mb-4">
                  {selectedDraft.subject}
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Body
                </div>
                <div className="prose prose-sm text-xs max-w-none">
                  {selectedDraft.bodyText.split("\n").map((line, i) => (
                    <p key={i} className="mb-2 text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
              <CardFooter className="flex justify-end gap-2 p-3 border-t border-border/60">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDraft(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(selectedDraft.id)}
                >
                  <Check className="h-3 w-3 mr-1" /> Approve & Queue
                </Button>
              </CardFooter>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}