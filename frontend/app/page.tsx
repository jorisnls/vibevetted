"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { startScan } from "@/lib/api"

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed || loading) return
    setLoading(true)
    try {
      const { scan_id } = await startScan(trimmed)
      router.push(`/results/${scan_id}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 py-12">
      <div className="w-full max-w-[720px] text-center">

        {/* ASCII banner */}
        <pre className="text-accent-dim text-[11px] leading-[1.4] mb-8 opacity-55 select-none" aria-hidden="true">{
`  ┌─────────────────────────────────────────────┐
  │   ▒▓█ V I B E   V E T T E D █▓▒              │
  └─────────────────────────────────────────────┘`}</pre>

        {/* Logo */}
        <h1 className="font-mono font-bold text-[52px] tracking-[-0.02em] mb-[14px] text-text [text-shadow:0_0_24px_rgba(127,255,155,0.18)]">
          <span className="text-accent font-normal mx-1.5">[</span>
          vibe<span className="text-accent mx-px">·</span>vetted
          <span className="text-accent font-normal mx-1.5">]</span>
        </h1>

        {/* Subtitle with blinking cursor */}
        <p className="text-text-dim text-[15px] mb-10">
          <span className="text-accent mr-2">&gt;</span>
          security scanner for vibe-coded apps
          <span className="inline-block w-[0.55em] ml-[0.15em] text-accent animate-blink align-baseline -translate-y-px">
            █
          </span>
        </p>

        {/* Scan form */}
        <form className="mb-[18px]" onSubmit={handleSubmit}>
          <div className="flex items-stretch bg-surface border border-border-2 rounded-lg p-1 transition-[border-color,box-shadow] duration-150 shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_20px_60px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.02)] focus-within:border-accent-dim focus-within:shadow-[0_0_0_1px_rgba(127,255,155,0.25),0_0_32px_-8px_rgba(127,255,155,0.25),0_20px_60px_-20px_rgba(0,0,0,0.7)]">
            <span className="flex items-center px-[14px] text-accent text-sm font-medium whitespace-nowrap border-r border-border">
              $ vibe-vet
            </span>
            <input
              className="flex-1 bg-transparent border-none outline-none text-text font-mono text-[15px] px-[14px] py-4 min-w-0 placeholder:text-text-dimmer"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/your-username/your-repo"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-accent text-bg font-semibold text-sm px-[22px] rounded-md inline-flex items-center gap-1.5 transition-[background,transform] duration-150 hover:bg-[#95ffae] active:translate-y-px cursor-pointer"
            >
              {loading ? "scanning..." : <>scan <span>→</span></>}
            </button>
          </div>

          {/* Hints */}
          <div className="flex justify-center gap-[10px] mt-3 text-text-dimmer text-xs">
            <span>↵ to scan</span>
            <span className="text-border-2">·</span>
            <span>public repos only</span>
            <span className="text-border-2">·</span>
            <span>~30s avg</span>
          </div>
        </form>

        {/* Example repo pills */}
        <div className="flex flex-wrap justify-center items-center gap-2 mt-8 text-xs">
          <span className="text-text-dimmer mr-1">try:</span>
          {["samoylenko/vulnerable-app-nodejs-express", "SirAppSec/vuln-node.js-express.js-app"].map((repo) => (
            <button
              key={repo}
              type="button"
              onClick={() => setUrl(`https://github.com/${repo}`)}
              className="border border-border-2 text-text-dim px-[10px] py-[5px] rounded-full font-mono transition-[color,border-color,background] duration-[120ms] hover:text-accent hover:border-accent-dim hover:bg-accent-bg cursor-pointer"
            >
              {repo}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="text-border-2 overflow-hidden whitespace-nowrap select-none text-xs leading-none my-6" aria-hidden="true">
          {"─".repeat(200)}
        </div>

        {/* Trust stats */}
        <div className="grid grid-cols-3 gap-6 my-6">
          {[
            { num: "2,847",  lbl: "repos scanned" },
            { num: "19,402", lbl: "vulns found"   },
            { num: "$0",     lbl: "stored. ever." },
          ].map(({ num, lbl }) => (
            <div key={lbl} className="text-center">
              <div className="text-[22px] text-text font-semibold tracking-[-0.02em]">{num}</div>
              <div className="text-[11px] text-text-dimmer mt-0.5">{lbl}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="flex flex-wrap justify-center items-center gap-2 mt-6 text-text-dimmer text-xs">
          <span>powered by</span>
          <code className="text-accent-dim">semgrep</code>
          <span>+</span>
          <code className="text-accent-dim">gitleaks</code>
          <span>+</span>
          <code className="text-accent-dim">llms</code>
          <span className="text-border-2 mx-1">//</span>
          <span>built for the vibe coders</span>
        </footer>

      </div>
    </div>
  )
}
