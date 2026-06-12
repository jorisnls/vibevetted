import type { ScanResult, Severity } from "@/lib/api"
import { SEVERITY_META } from "@/lib/severity"

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"]

export default function ScanSummary({ result }: { result: ScanResult }) {
  const total = result.findings.length

  return (
    <div className="grid grid-cols-1 gap-5 bg-surface border border-border-2 rounded-[10px] px-5 py-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.6)] md:grid-cols-[1fr_auto] md:gap-8 md:px-7 md:py-6">

      {/* Left: total count + repo URL */}
      <div>
        <div className="flex items-baseline gap-[10px]">
          <span className="text-[40px] font-bold tracking-[-0.04em] text-text leading-none md:text-[56px]">
            {total}
          </span>
          <span className="text-text-dim text-sm">findings</span>
        </div>
        <div className="mt-[10px] text-text-dim text-[13px]">
          scanned <code className="text-accent break-all">{result.repo_url.replace(/^https?:\/\//, "")}</code>
        </div>
      </div>

      {/* Right: severity stat boxes */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3 md:self-center">
        {SEVERITIES.map((sev) => {
          const meta = SEVERITY_META[sev]
          const count = result.summary[sev] ?? 0
          return (
            <div
              key={sev}
              className={`px-3.5 py-3 bg-bg-1 border border-border border-l-[3px] ${meta.border} rounded-md md:px-4 md:py-[14px]`}
            >
              <div className={`text-[22px] font-bold leading-none tracking-[-0.02em] md:text-[26px] ${meta.text}`}>
                {count}
              </div>
              <div className="mt-1.5 text-[11px] tracking-[0.06em] flex items-center gap-[5px] text-text-dim">
                <span className={meta.text}>{meta.glyph}</span>
                {meta.label}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
