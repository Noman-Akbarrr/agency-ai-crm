"use client"

import { Badge } from "@/components/ui/badge"

export function BadgeStatus({
  status,
  isSuppressed,
}: {
  status: string
  isSuppressed: boolean
}) {
  const variants: Record<string, string> = {
    UNVERIFIED: "bg-muted text-muted-foreground",
    LOCAL_MX_PASSED: "bg-yellow/10 text-yellow-900 border border-yellow/20",
    VALID: "bg-green/10 text-green-900 border border-green/20",
    INVALID: "bg-red/10 text-red-900 border border-red/20",
    CATCH_ALL: "bg-orange/10 text-orange-900 border border-orange/20",
    SPAM_TRAP: "bg-purple/10 text-purple-900 border border-purple-200",
    ROLE_FILTERED: "bg-slate/10 text-slate-900 border border-slate/20",
  }

  const displayStatus = isSuppressed ? "SUPPRESSED" : status

  return (
    <Badge
      variant={isSuppressed ? "secondary" : "default"}
      className={`text-xs font-mono tabular-nums border ${variants[status] ?? variants.UNVERIFIED}`}
    >
      {displayStatus}
    </Badge>
  )
}