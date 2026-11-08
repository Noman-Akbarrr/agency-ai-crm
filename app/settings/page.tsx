import { prisma } from "@/lib/prisma"
import { SettingsForm } from "@/components/settings/settings-form"
import { ApiKeysSection } from "@/components/settings/api-keys-section"

export default function SettingsPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="px-4 py-3 border-b border-border/60 bg-background/50 backdrop-blur flex-shrink-0 z-10">
        <h1 className="font-semibold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage API keys, daily send cap, sender identity, and agent access.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <SettingsForm />
        <ApiKeysSection />
      </div>
    </div>
  )
}