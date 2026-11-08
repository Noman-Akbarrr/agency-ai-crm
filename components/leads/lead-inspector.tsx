"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, Edit2 } from "lucide-react"
import { toast } from "sonner"

interface ContactData {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  role: string | null
  verificationStatus: string
  mxRecordsFound: boolean
  isSuppressed: boolean
  aiPersonalizationHook: string | null
  company: {
    id: string
    name: string
    industry: string | null
    state: string | null
    stage: string
    timezone: string
  }
  outreachMessages: Array<{
    id: string
    sequenceStep: number
    subject: string
    bodyHtml: string
    bodyText: string
    status: string
    scheduledAt: string | null
    sentAt: string | null
    internetMessageId: string | null
  }>
  inboxReplies: Array<{
    id: string
    fromEmail: string
    subject: string
    bodyText: string
    receivedAt: string
  }>
}

export function LeadInspector({
  open,
  contactId,
  onOpenChange,
}: {
  open: boolean
  contactId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const [contact, setContact] = useState<ContactData | null>(null)
  const [company, setCompany] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [replies, setReplies] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"details" | "outreach" | "replies">(
    "details"
  )
  const [aiHook, setAiHook] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!contactId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/contacts/${contactId}`, {
          headers: { "Content-Type": "application/json" },
        })
        const data = await res.json()
        if (!cancelled && data.success) {
          const c = data.data
          setContact(c)
          setCompany(c.company)
          setMessages(c.outreachMessages)
          setReplies(c.inboxReplies)
          setAiHook(c.aiPersonalizationHook ?? "")
        }
      } catch (err) {
        console.error("Failed to load contact:", err)
        toast.error("Failed to load contact")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [contactId])

  const handleSaveHook = async () => {
    if (!contact) return
    setSaving(true)
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiPersonalizationHook: aiHook || null }),
      })
      if (res.ok) {
        toast.success("Personalization hook saved")
      } else {
        toast.error("Failed to save hook")
      }
    } catch (err) {
      toast.error("Failed to save hook")
    } finally {
      setSaving(false)
    }
  }

  if (!open || !contact) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px]">
        <SheetHeader className="pb-2">
          <SheetTitle>
            {contact.firstName || ""} {contact.lastName || ""}
          </SheetTitle>
          <div className="flex items-center gap-1 mt-1">
            <Badge variant={contact.isSuppressed ? "secondary" : "default"} className="text-xs font-mono">
              {contact.verificationStatus}
            </Badge>
            {contact.isSuppressed && (
              <Badge variant="destructive" className="text-xs font-mono">
                SUPPRESSED
              </Badge>
            )}
          </div>
        </SheetHeader>
        <Separator />

        <div className="flex h-[calc(100vh-5rem)] flex-col">
          <div className="border-b border-border/60 bg-background/50 flex-shrink-0 z-10">
            <Tabs
              value={activeTab}
              onValueChange={(v: string) => setActiveTab(v as "details" | "outreach" | "replies")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="outreach">Outreach</TabsTrigger>
                <TabsTrigger value="replies">Replies</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {activeTab === "details" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs tabular-nums">
                      {contact.email}
                    </span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs tabular-nums">
                        {contact.phone}
                      </span>
                    </div>
                  )}
                  {contact.role && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Role</span>
                      <span className="text-xs">{contact.role}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Company
                    </span>
                    <span className="text-xs font-medium">{company?.name}</span>
                  </div>
                  {company?.industry && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Industry
                      </span>
                      <span className="text-xs">{company.industry}</span>
                    </div>
                  )}
                  {company?.state && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        State
                      </span>
                      <span className="font-mono text-xs">{company.state}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Pipeline Stage
                    </span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {company?.stage}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      MX Records
                    </span>
                    <span className="text-xs">{contact.mxRecordsFound ? "Found" : "None"}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      AI Personalization Hook
                    </span>
                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <Textarea
                    value={aiHook}
                    onChange={(e) => setAiHook(e.target.value)}
                    placeholder="Personalization hook for AI copy..."
                    className="h-24 text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveHook}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? "Saving..." : "Save Hook"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "outreach" && (
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No outreach messages yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div key={m.id} className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">
                            Step {m.sequenceStep}
                          </span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {m.status}
                          </Badge>
                        </div>
                        <div className="text-xs font-mono tabular-nums mb-1">
                          {m.subject}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {m.bodyText}
                        </div>
                        {m.scheduledAt && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Scheduled: {new Date(m.scheduledAt).toLocaleString()}
                          </div>
                        )}
                        {m.sentAt && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Sent: {new Date(m.sentAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "replies" && (
              <div className="space-y-3">
                {replies.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No inbound replies yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {replies.map((r) => (
                      <div key={r.id} className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono tabular-nums text-muted-foreground">
                            {r.fromEmail}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.receivedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs font-medium">{r.subject}</div>
                        <div className="text-xs text-muted-foreground line-clamp-3 mt-1">
                          {r.bodyText}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}