import { prisma } from "@/lib/prisma"
import { OutreachCounters } from "@/components/outreach/outreach-counters"
import { ScheduledQueue } from "@/components/outreach/scheduled-queue"
import { DraftApproval } from "@/components/outreach/draft-approval"
import { InboxReplies } from "@/components/outreach/inbox-replies"

export default function OutreachPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="px-4 py-3 border-b border-border/60 bg-background/50 backdrop-blur flex-shrink-0 z-10">
        <h1 className="font-semibold text-foreground">Outreach Command Center</h1>
        <p className="text-xs text-muted-foreground">
          Monitor sends, approve AI drafts, and manage inbound replies.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <OutreachCounters />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ScheduledQueue />
          <DraftApproval />
        </div>

        <InboxReplies />
      </div>
    </div>
  )
}