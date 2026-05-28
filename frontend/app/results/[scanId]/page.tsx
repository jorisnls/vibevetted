"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getScanResult } from "@/lib/api"
import type { ScanResult } from "@/lib/api"
import LoadingState from "@/components/LoadingState"

export default function ResultsPage() {
  const { scanId } = useParams<{ scanId: string }>()
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stopped = false

    async function poll() {
      try {
        const data = await getScanResult(scanId)
        if (stopped) return
        setResult(data)
        if (data.status === "done" || data.status === "failed") {
          stopped = true
        }
      } catch (err) {
        if (stopped) return
        setError(err instanceof Error ? err.message : "Something went wrong")
        stopped = true
      }
    }

    poll() // fetch immediately, don't wait for the first interval tick

    const intervalId = setInterval(() => {
      if (!stopped) poll()
    }, 2000)

    // cleanup: stop polling when the component unmounts
    return () => {
      stopped = true
      clearInterval(intervalId)
    }
  }, [scanId])

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-8 font-mono">
        <div className="text-sev-crit text-sm">Error: {error}</div>
      </div>
    )
  }

  if (!result || result.status === "pending" || result.status === "running") {
    return <LoadingState repoUrl={result?.repo_url ?? ""} />
  }

  // Temporary raw view — replaced in steps 7-9
  return (
    <div className="p-8 font-mono">
      <p className="text-text-dim text-sm mb-1">scan_id: {result.scan_id}</p>
      <p className="text-text text-sm mb-4">
        status: <span className="text-accent">{result.status}</span>
        {" · "}findings: {result.findings.length}
      </p>
      <pre className="text-xs text-text-dim bg-surface border border-border rounded-lg p-4 overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}
