import { KanbanBoard } from "@/components/pipeline/kanban-board"

const PIPELINE_STAGES: Array<{
  id: string
  label: string
}> = [
  { id: "NEW_SCRAPE", label: "New Scrape" },
  { id: "LOCAL_FILTERED", label: "Local Filtered" },
  { id: "READY_FOR_OUTREACH", label: "Ready for Outreach" },
  { id: "CONTACTED", label: "Contacted" },
  { id: "ENGAGED", label: "Engaged" },
  { id: "REPLIED", label: "Replied" },
  { id: "QUALIFIED", label: "Qualified" },
  { id: "DISQUALIFIED", label: "Disqualified" },
]

export default function PipelinePage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="px-4 py-3 border-b border-border/60 bg-background/50 backdrop-blur flex-shrink-0 z-10">
        <h1 className="font-semibold text-foreground">Pipeline</h1>
        <p className="text-xs text-muted-foreground">
          Drag leads between stages to update their pipeline position.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <KanbanBoard stages={PIPELINE_STAGES} />
      </div>
    </div>
  )
}