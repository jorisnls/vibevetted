import type { Severity } from "@/lib/api"

export const SEVERITY_META: Record<Severity, {
  label:  string
  glyph:  string
  badge:  string  // classes for SeverityBadge
  border: string  // left border class for cards and stat boxes
  text:   string  // plain text color class
}> = {
  critical: {
    label:  "CRITICAL",
    glyph:  "▲",
    badge:  "text-sev-crit bg-sev-crit/15 border-sev-crit/40",
    border: "border-l-sev-crit",
    text:   "text-sev-crit",
  },
  high: {
    label:  "HIGH",
    glyph:  "▲",
    badge:  "text-sev-high bg-sev-high/15 border-sev-high/40",
    border: "border-l-sev-high",
    text:   "text-sev-high",
  },
  medium: {
    label:  "MEDIUM",
    glyph:  "◆",
    badge:  "text-sev-med bg-sev-med/15 border-sev-med/40",
    border: "border-l-sev-med",
    text:   "text-sev-med",
  },
  low: {
    label:  "LOW",
    glyph:  "●",
    badge:  "text-sev-low bg-sev-low/15 border-sev-low/40",
    border: "border-l-sev-low",
    text:   "text-sev-low",
  },
}
