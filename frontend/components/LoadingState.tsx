"use client"

import { useState, useEffect } from "react"

const SCAN_STEPS = [
  { label: "Resolving repository",    detail: "checking github.com",          ms: 600  },
  { label: "Cloning repository",      detail: "git clone",          ms: 1200 },
  { label: "Indexing source tree",    detail: "reading file structure",        ms: 700  },
  { label: "Running Semgrep",         detail: "p/javascript + p/typescript",  ms: 2000 },
  { label: "Running Gitleaks",        detail: "scanning git history",         ms: 1500 },
  { label: "Generating explanations", detail: "claude cooking",             ms: 1000 },
]

const SPINNER_CHARS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

export default function LoadingState({ repoUrl }: { repoUrl: string }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [tick, setTick] = useState(0)

  // Each completed step schedules the next one after its own ms delay
  useEffect(() => {
    if (stepIdx >= SCAN_STEPS.length) return
    const t = setTimeout(() => setStepIdx((i) => i + 1), SCAN_STEPS[stepIdx].ms)
    return () => clearTimeout(t)
  }, [stepIdx])

  // Spinner updates independently every 80ms
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 80)
    return () => clearInterval(id)
  }, [])

  const animationDone = stepIdx >= SCAN_STEPS.length
  const completedSteps = SCAN_STEPS.slice(0, stepIdx)
  const currentStep = animationDone ? null : SCAN_STEPS[stepIdx]
  // Cap at 90% — the last 10% is reserved for when the real scan confirms done
  const progress = Math.min(90, Math.round((stepIdx / SCAN_STEPS.length) * 100))
  const spinner = SPINNER_CHARS[tick % SPINNER_CHARS.length]
  const displayRepo = repoUrl.replace(/^https?:\/\//, "")

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-[760px] bg-surface border border-border-2 rounded-[10px] overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_30px_80px_-30px_rgba(0,0,0,0.8)]">

        {/* macOS-style window chrome */}
        <div className="flex items-center gap-2 px-[14px] py-[10px] bg-bg-2 border-b border-border">
          <span className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
          <span className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
          <span className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
          <span className="ml-3 text-text-dim text-xs">vibe-vet — scanning {displayRepo}</span>
        </div>

        <div className="p-6">
          {/* Boot log */}
          <div className="bg-bg-1 border border-border rounded-md px-4 py-[14px] min-h-[260px]">

            {/* Completed steps */}
            {completedSteps.map((step, i) => (
              <div key={i} className="grid grid-cols-[18px_1fr_auto] items-baseline gap-[10px] py-[3px] text-[13px]">
                <span className="text-accent font-bold">✓</span>
                <span className="text-text">{step.label}</span>
                <span className="text-text-dimmer text-xs">{step.detail}</span>
              </div>
            ))}

            {/* Active step — or holding state after animation finishes */}
            {currentStep ? (
              <div className="grid grid-cols-[18px_1fr_auto] items-baseline gap-[10px] py-[3px] text-[13px]">
                <span className="text-accent">{spinner}</span>
                <span className="text-accent">{currentStep.label}...</span>
                <span className="text-text-dim text-xs">{currentStep.detail}</span>
              </div>
            ) : (
              <div className="grid grid-cols-[18px_1fr_auto] items-baseline gap-[10px] py-[3px] text-[13px]">
                <span className="text-accent">{spinner}</span>
                <span className="text-accent">Awaiting results...</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-[18px]">
            <div className="h-[6px] bg-bg-1 border border-border rounded-[4px] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-dim to-accent transition-[width] duration-[400ms] shadow-[0_0_12px_var(--color-accent-dim)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-2 text-text-dimmer text-xs mt-2">
              <span>{progress}%</span>
              <span>·</span>
              <span>{stepIdx} / {SCAN_STEPS.length} stages</span>
            </div>
          </div>

          {/* Tip */}
          <div className="mt-[18px] px-[14px] py-[10px] bg-accent-bg border border-dashed border-accent-dim rounded-md text-text-dim text-xs flex gap-[10px]">
            <span className="text-accent whitespace-nowrap">// tip</span>
            <span>most vibe-coded apps fail on hardcoded secrets — we check git history, not just HEAD.</span>
          </div>
        </div>

      </div>
    </div>
  )
}
