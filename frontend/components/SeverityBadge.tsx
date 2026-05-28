import type { Severity } from "@/lib/api"
import { SEVERITY_META } from "@/lib/severity"

export default function SeverityBadge({ severity }: { severity: Severity }) {
  const meta = SEVERITY_META[severity]
  return (
    <span className={`inline-flex items-center gap-[5px] px-[9px] py-[3px] text-[10.5px] font-semibold tracking-[0.1em] border rounded-[4px] ${meta.badge}`}>
      <span className="text-[9px]">{meta.glyph}</span>
      {meta.label}
    </span>
  )
}
