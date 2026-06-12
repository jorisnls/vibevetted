"use client"

import { useState } from "react"
import type { Finding } from "@/lib/api"
import { SEVERITY_META } from "@/lib/severity"
import SeverityBadge from "@/components/SeverityBadge"

// Turns **bold** markers into styled <strong> elements
function renderExplanation(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-accent">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export default function FindingCard({ finding, defaultOpen = false }: { finding: Finding, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const meta = SEVERITY_META[finding.severity]

  return (
    <div className={`bg-surface border border-border border-l-[3px] ${meta.border} rounded-lg overflow-hidden`}>

      {/* Header — click anywhere to expand/collapse */}
      <button
        className="w-full flex flex-col px-4 pt-3 pb-[14px] text-left cursor-pointer md:px-[18px]"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Top row: badges + chevron */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 w-full mb-2">
          <div className="flex items-center gap-[10px]">
            <SeverityBadge severity={finding.severity} />
            <span className="text-[11px] px-2 py-[3px] bg-bg-1 border border-border-2 text-text-dim rounded-[4px]">
              {finding.tool}
            </span>
            <span className="text-[11px] text-text-dimmer">#{finding.id}</span>
          </div>
          <div className="flex items-center gap-[10px]">
            {finding.cwe && (
              <span className="text-[11px] text-text-dimmer px-2 py-[3px] border border-border rounded-[4px]">
                {finding.cwe}
              </span>
            )}
            <span className={`text-text-dimmer text-sm transition-transform duration-[180ms] inline-block ${open ? "rotate-90 text-accent" : ""}`}>
              ▸
            </span>
          </div>
        </div>

        {/* Bottom row: title + file:line */}
        <div className="flex flex-wrap justify-between items-baseline gap-[10px] w-full">
          <div className="text-[15px] font-semibold text-text tracking-[-0.005em] break-all">
            {finding.title}
          </div>
          {finding.file_path && (
            <div className="text-[12.5px] text-text-dim font-mono break-all">
              <span>{finding.file_path}</span>
              {finding.line_number !== null && (
                <>
                  <span className="text-text-dimmer">:</span>
                  <span className={meta.text}>{finding.line_number}</span>
                </>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Expanded body — only rendered when open */}
      {open && (
        <div className="border-t border-dashed border-border px-4 py-4 bg-gradient-to-b from-black/15 to-transparent md:px-[18px]">
          <div className="bg-bg-1 border border-border rounded-md p-4">

            {/* Section header */}
            <div className="flex items-baseline gap-2 text-[11px] text-accent tracking-[0.1em] uppercase mb-3 pb-[10px] border-b border-dashed border-border">
              <span>◇</span>
              fix explanation
              <span className="text-text-dimmer text-[10.5px] normal-case tracking-normal ml-auto">
                // generated
              </span>
            </div>

            {/* The explanation string with **bold** rendered */}
            <p className="text-text text-[13px] leading-[1.65] whitespace-pre-wrap font-mono break-words">
              {renderExplanation(finding.fix_explanation)}
            </p>

            {/* CWE link — only if present */}
            {finding.cwe && (
              <div className="mt-3 pt-[10px] border-t border-dashed border-border">
                <a
                  href={`https://cwe.mitre.org/data/definitions/${finding.cwe.replace("CWE-", "")}.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent underline decoration-dotted underline-offset-2"
                >
                  <span>↗</span>
                  read {finding.cwe} on cwe.mitre.org
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
