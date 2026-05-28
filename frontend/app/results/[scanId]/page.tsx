"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getScanResult } from "@/lib/api"
import type { ScanResult, Severity, Finding } from "@/lib/api"
import LoadingState from "@/components/LoadingState"
import ScanSummary from "@/components/ScanSummary"
import FindingCard from "@/components/FindingCard"
import { SEVERITY_META } from "@/lib/severity"

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"]

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

    poll()

    const intervalId = setInterval(() => {
      if (!stopped) poll()
    }, 2000)

    return () => {
      stopped = true
      clearInterval(intervalId)
    }
  }, [scanId])

  // Network / fetch error
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-8 font-mono text-center">
        <div>
          <p className="text-sev-crit text-sm mb-4">error: {error}</p>
          <Link href="/" className="text-accent text-sm hover:underline">
            ← try another repo
          </Link>
        </div>
      </div>
    )
  }

  // Waiting for first poll or scan still in progress
  if (!result || result.status === "pending" || result.status === "running") {
    return <LoadingState repoUrl={result?.repo_url ?? ""} />
  }

  // Backend reported a scan failure
  if (result.status === "failed") {
    return (
      <div className="min-h-screen grid place-items-center p-8 font-mono text-center">
        <div>
          <p className="text-text-dim text-sm mb-2">scan failed</p>
          <p className="text-sev-crit text-xs mb-6">{result.error ?? "unknown error"}</p>
          <Link href="/" className="text-accent text-sm hover:underline">
            ← try another repo
          </Link>
        </div>
      </div>
    )
  }

  // Group findings by severity in display order
  const grouped = Object.fromEntries(
    SEVERITIES.map((sev) => [sev, result.findings.filter((f) => f.severity === sev)])
  ) as Record<Severity, Finding[]>

  return (
    <div>

      {/* Sticky header */}
      <header className="sticky top-0 z-10 flex items-center gap-6 px-7 py-4 border-b border-border bg-bg/70 backdrop-blur-sm">
        <Link
          href="/"
          className="text-text-dim text-[13px] inline-flex items-center gap-1.5 px-[10px] py-1.5 rounded-[5px] hover:text-accent hover:bg-accent-bg transition-colors duration-[120ms]"
        >
          ← new scan
        </Link>
        <div className="text-base font-semibold tracking-[-0.02em]">
          <span className="text-accent font-normal mx-1.5">[</span>
          vibe<span className="text-accent mx-px">·</span>vetted
          <span className="text-accent font-normal mx-1.5">]</span>
        </div>
        <div className="ml-auto">
          <Link
            href="/"
            className="text-accent text-xs px-3 py-[7px] border border-accent-dim bg-accent-bg rounded-[5px] inline-flex items-center gap-1.5 hover:bg-accent hover:text-bg transition-[background,color] duration-[120ms]"
          >
            ↻ new scan
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1080px] mx-auto px-7 py-8">
        <ScanSummary result={result} />

        {/* Divider */}
        <div className="text-border-2 overflow-hidden whitespace-nowrap select-none text-xs leading-none my-8" aria-hidden="true">
          {"─".repeat(200)}
        </div>

        {/* Findings grouped by severity */}
        {SEVERITIES.filter((sev) => grouped[sev].length > 0).map((sev) => {
          const meta = SEVERITY_META[sev]
          const items = grouped[sev]
          return (
            <section key={sev} className="mt-9 first:mt-0">
              {/* Group heading with fading line */}
              <h2 className={`flex items-center gap-[10px] text-[13px] font-medium tracking-[0.1em] mb-4 ${meta.text}`}>
                <span>{meta.glyph}</span>
                <span>{meta.label}</span>
                <span className="text-text-dimmer font-normal">({items.length})</span>
                <span className="flex-1 h-px bg-gradient-to-r from-current to-transparent opacity-40 ml-1.5" />
              </h2>
              <div className="flex flex-col gap-3">
                {items.map((finding) => (
                  <FindingCard key={finding.id} finding={finding} />
                ))}
              </div>
            </section>
          )
        })}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border flex justify-between text-text-dimmer text-xs">
          <div>end of report // {result.findings.length} findings</div>
          <div className="text-accent">
            $ echo &quot;ship it&quot;
            <span className="inline-block w-[0.55em] ml-[0.15em] animate-blink align-baseline">█</span>
          </div>
        </footer>
      </main>

    </div>
  )
}
