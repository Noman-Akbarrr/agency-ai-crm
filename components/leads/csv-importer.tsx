"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Upload, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface ColumnMapping {
  [key: string]: string | null
}

export function CsvImporter() {
  const [mappingStep, setMappingStep] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [columns, setColumns] = useState<string[]>([])
  const [importing, setImporting] = useState(false)

  const defaultColumns = [
    "email",
    "firstName",
    "lastName",
    "role",
    "companyName",
    "industry",
    "website",
    "phone",
    "address",
    "city",
    "state",
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split("\n").filter((l) => l.trim())
      if (lines.length === 0) return
      const headers = lines[0].split(",").map((h) => h.trim())
      setColumns(headers)
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim())
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => {
          obj[h] = values[i] ?? ""
        })
        return obj
      })
      setPreview(rows.slice(0, 10))
      // Auto-map by name similarity
      const mapping: ColumnMapping = {}
      headers.forEach((h) => {
        const lower = h.toLowerCase()
        if (lower.includes("email")) mapping[h] = "email"
        else if (lower.includes("first")) mapping[h] = "firstName"
        else if (lower.includes("last")) mapping[h] = "lastName"
        else if (lower.includes("role") || lower.includes("title")) mapping[h] = "role"
        else if (lower.includes("company")) mapping[h] = "companyName"
        else if (lower.includes("industry")) mapping[h] = "industry"
        else if (lower.includes("website") || lower.includes("url")) mapping[h] = "website"
        else if (lower.includes("phone")) mapping[h] = "phone"
        else if (lower.includes("address")) mapping[h] = "address"
        else if (lower.includes("city")) mapping[h] = "city"
        else if (lower.includes("state")) mapping[h] = "state"
        else mapping[h] = null
      })
      setColumnMapping(mapping)
      setMappingStep(true)
    }
    reader.readAsText(f)
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const rows = preview.map((row) => {
        const mapped: Record<string, unknown> = {}
        Object.entries(columnMapping).forEach(([csvCol, crmField]) => {
          if (crmField) mapped[crmField] = row[csvCol] ?? ""
        })
        return mapped
      })

      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      })

      const result = await response.json()
      if (result.success) {
        alert(
          `Import complete: ${result.data.imported} imported, ${result.data.skipped} skipped, ${result.data.invalid} invalid`
        )
        setFile(null)
        setPreview([])
        setMappingStep(false)
        window.location.reload()
      } else {
        alert("Import failed: " + result.error)
      }
    } catch (err) {
      alert("Import failed: " + (err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <SheetContent className="p-0">
      <SheetHeader className="px-6 py-4">
        <SheetTitle>CSV Import</SheetTitle>
        <SheetClose />
      </SheetHeader>
      <Separator />

      <div className="p-6 space-y-6">
        {!mappingStep ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div onClick={(e) => {
                if (e.target === e.currentTarget) {
                  const input = e.currentTarget.querySelector('input')
                  if (input) input.click()
                }
              }}>
                <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Drop CSV file here</p>
                <p className="text-xs text-muted-foreground">
                  Columns: email, firstName, lastName, companyName, state, etc.
                </p>
              </div>
            </div>
            {file && (
              <div className="flex items-center gap-3 px-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{file.name}</span>
                <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                  Change
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Map Columns</h3>
              <span className="text-xs text-muted-foreground">
                {preview.length} row(s) preview
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto border rounded-lg p-2 space-y-1">
              {columns.map((col) => (
                <div key={col} className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded">
                  <span className="text-xs text-muted-foreground">{col}</span>
                  <select
                    value={columnMapping[col] ?? ""}
                    onChange={(e) =>
                      setColumnMapping({
                        ...columnMapping,
                        [col]: e.target.value || null,
                      })
                    }
                    className="text-xs border rounded bg-background"
                  >
                    <option value="">Skip</option>
                    {defaultColumns.map((dc) => (
                      <option key={dc} value={dc}>
                        {dc}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="border rounded-lg p-3 bg-muted/50">
              <h4 className="text-xs font-medium mb-2">Preview</h4>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b">
                      {columns.map((col) => (
                        <th key={col} className="text-left pb-1 pr-2 text-muted-foreground">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b">
                        {columns.map((col) => (
                          <td key={col} className="pr-2 font-mono tabular-nums">
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setMappingStep(false)}>
                Back
              </Button>
              <Button size="sm" onClick={handleImport} disabled={importing}>
                {importing ? "Importing..." : "Import Leads"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </SheetContent>
  )
}