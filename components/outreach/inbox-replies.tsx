"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Clock, ArrowRight } from "lucide-react"

interface InboxReply {
  id: string
  fromEmail: string
  subject: string
  bodyText: string
  receivedAt: Date
  contactName: string | null
}

export function InboxReplies() {
  const [replies, setReplies] = useState<InboxReply[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/inbox-replies", {
          headers: { "Content-Type": "application/json" },
        })
        const data = await res.json()
        if (!cancelled && data.success) {
          setReplies(data.data)
        }
      } catch (err) {
        console.error("Failed to load replies:", err)
      } finally {
        if (!cancelled) setLoading(false)
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
          <CardTitle className="text-sm">Inbound Replies</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex h-6 w-6 rounded-full border-2 border-border/60 border-t-primary animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm">Inbound Replies</CardTitle>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {replies.length}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border/60">
          {replies.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No inbound replies yet.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {replies.map((r) => (
                <div key={r.id} className="p-3 hover:bg-muted/50 transition-colors group cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {r.contactName || r.fromEmail}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-muted-foreground">
                        {r.fromEmail}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.receivedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-foreground mb-1">
                    {r.subject}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {r.bodyText}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRight className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    <span className="group-hover:text-primary transition-colors">View thread</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}