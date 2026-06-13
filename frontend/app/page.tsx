"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { startScan, getStats, type Stats } from "@/lib/api"
import { SEVERITY_META } from "@/lib/severity"
import type { Severity } from "@/lib/api"
import EmailCapture from "@/components/EmailCapture"

// ─── data ────────────────────────────────────────────────────────────────────

const DEMO_REPOS = [
  { label: "vulnerable-app-nodejs-express", url: "https://github.com/samoylenko/vulnerable-app-nodejs-express" },
  { label: "vuln-node.js-express.js-app",   url: "https://github.com/SirAppSec/vuln-node.js-express.js-app"  },
]

type ExampleFindingData = {
  severity: Severity
  tool: string
  title: string
  file: string
  line: number
  snippet: string
  explanation: { whatsWrong: string; howToFix: string }
}

const EXAMPLE_FINDINGS: ExampleFindingData[] = [
  {
    severity: "critical",
    tool: "gitleaks",
    title: "supabase_key_exposed_in_client_bundle",
    file: "dist/assets/index-c4a81f.js",
    line: 1,
    snippet: `createClient("https://xyzcompany.supabase.co",\n  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0…")`,
    explanation: {
      whatsWrong:
        "A Supabase key with the service_role claim is shipped inside your client JavaScript bundle. Unlike the anon key, this one bypasses Row Level Security entirely — anyone who opens DevTools can read and write your whole database.",
      howToFix:
        "Rotate the key in Supabase → Settings → API. Use the service-role key only in server-side code, referenced via an environment variable that never gets bundled into the client.",
    },
  },
  {
    severity: "critical",
    tool: "semgrep",
    title: "sql_injection_in_api_route",
    file: "app/api/orders/route.ts",
    line: 18,
    snippet: `const orders = await db.query(\n  \`SELECT * FROM orders WHERE user_id = \${searchParams.get("uid")}\`\n);`,
    explanation: {
      whatsWrong:
        "The uid query parameter is interpolated straight into a SQL string. Anyone can pass `1 OR 1=1` and read every order in the table — or worse.",
      howToFix:
        "Use a parameterized query: `db.query('SELECT * FROM orders WHERE user_id = $1', [uid])`. Every modern driver supports this; never build SQL with template literals.",
    },
  },
  {
    severity: "high",
    tool: "gitleaks",
    title: "hardcoded_jwt_secret",
    file: "lib/auth.ts",
    line: 7,
    snippet: `const JWT_SECRET = "super-secret-change-me-later";`,
    explanation: {
      whatsWrong:
        "The JWT signing secret is a guessable string committed to a public repo. Anyone who reads it can forge a valid session token for any user, including admins.",
      howToFix:
        "Generate a strong secret (`openssl rand -base64 32`), move it to an environment variable, and rotate it — which invalidates all current sessions, by design.",
    },
  },
]

const EXAMPLE_COUNTS = { critical: 2, high: 3, medium: 5, low: 0 }
const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low"]

// ─── sub-components ──────────────────────────────────────────────────────────

function SiteNav() {
  return (
    <nav className="flex items-center justify-between py-5" aria-label="Main">
      <div className="font-mono font-semibold text-base tracking-[-0.02em]">
        <span className="text-accent font-normal mx-1">[</span>
        vibe<span className="text-accent mx-px">·</span>vetted
        <span className="text-accent font-normal mx-1">]</span>
      </div>
      <div className="flex gap-4">
        <a
          className="font-mono text-[13px] text-text-dim hover:text-accent hover:no-underline transition-colors duration-[120ms]"
          href="https://github.com/jorisnls"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  )
}

function ScanForm({
  url,
  setUrl,
  loading,
  error,
  onSubmit,
  onChip,
}: {
  url: string
  setUrl: (v: string) => void
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
  onChip: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <div className="w-full max-w-[640px]">
      <form onSubmit={onSubmit}>
        {/* Input shell */}
        <div className="flex items-stretch bg-surface border border-border-2 rounded-[10px] p-[5px] shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_20px_60px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.02)] transition-[border-color,box-shadow] duration-150 focus-within:border-accent-dim focus-within:shadow-[0_0_0_1px_rgba(127,255,155,0.25),0_0_32px_-8px_rgba(127,255,155,0.25),0_20px_60px_-20px_rgba(0,0,0,0.7)]">
          <span className="flex items-center pl-[14px] pr-1 text-accent font-mono text-[15px] font-medium" aria-hidden="true">
            $
          </span>
          <label className="sr-only" htmlFor="repo-url">Public GitHub repository URL</label>
          <input
            id="repo-url"
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-text font-mono text-[15px] px-3 py-[15px] min-w-0 placeholder:text-text-dimmer"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="github.com/your-username/your-repo"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-bg font-semibold text-[15px] px-[22px] rounded-[7px] inline-flex items-center gap-[7px] whitespace-nowrap transition-[transform,background] duration-[80ms] hover:bg-[#95ffae] active:translate-y-px disabled:opacity-70 cursor-pointer"
          >
            {loading ? "scanning…" : <>Scan free <span aria-hidden="true">→</span></>}
          </button>
        </div>
        <p className="font-mono text-text-dimmer text-xs mt-3">
          no signup · public repos only · ~30 seconds
        </p>
        {error && (
          <p className="mt-2 text-sev-crit text-xs">{error}</p>
        )}
      </form>

      {/* Demo chips */}
      <div className="flex flex-col items-center gap-[10px] mt-6">
        <span className="text-text-dimmer text-[13px]">or try a demo repo:</span>
        <div className="flex flex-wrap justify-center gap-2">
          {DEMO_REPOS.map((r) => (
            <button
              key={r.url}
              className="inline-flex items-center gap-[7px] font-mono text-[13px] text-text-dim border border-border-2 bg-bg-1 px-[14px] py-2 rounded-full transition-[color,border-color,background] duration-[120ms] hover:text-accent hover:border-accent-dim hover:bg-accent-bg cursor-pointer"
              onClick={() => onChip(r.url)}
            >
              <span className="text-accent text-[10px]" aria-hidden="true">▸</span>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Hero({
  url, setUrl, loading, error, onSubmit, onChip,
}: {
  url: string
  setUrl: (v: string) => void
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
  onChip: (url: string) => void
}) {
  return (
    <section className="text-center py-10 flex flex-col items-center md:py-16" aria-labelledby="hero-title">
      <p className="font-mono text-xs tracking-[0.08em] text-accent bg-accent-bg border border-accent/25 rounded-full px-[14px] py-[5px] mb-6">
        free security scan · built for AI-generated code
      </p>
      <h1
        id="hero-title"
        className="text-[clamp(32px,6vw,56px)] font-bold tracking-[-0.03em] leading-[1.12] max-w-[18ch]"
      >
        Cursor wrote your code.<br />
        Did it also{" "}
        <em className="not-italic text-accent">leak your API keys?</em>
      </h1>
      <p className="text-text-dim text-[clamp(16px,2.2vw,19px)] leading-[1.6] max-w-[52ch] mt-6 mb-10">
        Free security scan for AI-generated repos. Powered by industry-standard
        static analysis tools, explained by AI. Results in ~30 seconds.
      </p>
      <ScanForm url={url} setUrl={setUrl} loading={loading} error={error} onSubmit={onSubmit} onChip={onChip} />
    </section>
  )
}

function ExampleFinding({ finding, defaultOpen = false }: { finding: ExampleFindingData; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const meta = SEVERITY_META[finding.severity]

  return (
    <div className={`bg-bg-1 border border-border border-l-[3px] ${meta.border} rounded-[8px] px-4 py-[14px]`}>
      <div className="flex flex-wrap items-center gap-[10px]">
        {/* Severity badge */}
        <span className={`inline-flex items-center gap-[5px] px-[9px] py-[3px] text-[10.5px] font-semibold tracking-[0.1em] border rounded-[4px] font-mono ${meta.badge}`}>
          <span className="text-[9px]">{meta.glyph}</span>
          {meta.label}
        </span>
        <span className="text-[11px] px-2 py-[3px] bg-bg-2 border border-border-2 text-text-dim rounded-[4px] font-mono">
          {finding.tool}
        </span>
        <span className="font-mono text-sm font-semibold text-text break-all">
          {finding.title}
        </span>
      </div>
      <div className="font-mono text-[12.5px] text-text-dim mt-1.5">
        <span>{finding.file}</span>
        <span className="text-text-dimmer">:</span>
        <span className={meta.text}>{finding.line}</span>
      </div>
      <pre className="mt-[10px] p-[10px] bg-bg border border-border rounded-[6px] font-mono text-[12.5px] leading-[1.6] text-text overflow-x-auto whitespace-pre">
        <code>{finding.snippet}</code>
      </pre>
      <button
        className="inline-flex items-center gap-[7px] mt-[10px] font-mono text-[12.5px] text-accent py-1 hover:underline cursor-pointer"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`text-text-dimmer text-sm transition-transform duration-[180ms] inline-block ${open ? "rotate-90 text-accent" : ""}`} aria-hidden="true">
          ▸
        </span>
        AI explanation + fix
      </button>
      {open && (
        <div className="mt-[10px] border-t border-dashed border-border pt-2 space-y-2">
          <div>
            <div className="font-mono font-bold text-sev-crit text-[13px] mb-1">What&apos;s wrong:</div>
            <div className="text-text text-sm leading-[1.65]">{finding.explanation.whatsWrong}</div>
          </div>
          <div className="border-t border-dashed border-border pt-2">
            <div className="font-mono font-bold text-accent text-[13px] mb-1">How to fix it:</div>
            <div className="text-text text-sm leading-[1.65]">{finding.explanation.howToFix}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExampleReport() {
  return (
    <section className="py-10 md:py-16" aria-labelledby="example-title">
      <div className="text-center mb-10">
        <h2 id="example-title" className="text-[clamp(24px,4vw,34px)] font-bold tracking-[-0.02em]">
          This is what you get back
        </h2>
        <p className="text-text-dim text-base max-w-[56ch] mt-3 mx-auto">
          Real findings, plain-English fixes. Here&apos;s a report from a typical AI-generated SaaS starter.
        </p>
      </div>

      {/* Report window */}
      <div className="bg-surface border border-border-2 rounded-[12px] overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_40px_100px_-40px_rgba(0,0,0,0.8)]">
        {/* Window chrome */}
        <div className="flex items-center gap-3 px-4 py-3 bg-bg-2 border-b border-border">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
            <span className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
            <span className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
          </div>
          <span className="font-mono text-xs text-text-dim overflow-hidden text-ellipsis whitespace-nowrap flex-1">
            github.com/demo/ai-saas-starter · 27.4s
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-[0.06em] text-accent border border-dashed border-accent-dim rounded-[4px] px-2 py-[3px] whitespace-nowrap">
            Example report
          </span>
        </div>

        {/* Report body */}
        <div className="p-5 md:p-7">
          {/* Summary counts */}
          <div className="flex flex-wrap items-center gap-[10px] mb-[18px]">
            {SEV_ORDER.map((sev) => {
              const meta = SEVERITY_META[sev]
              const count = EXAMPLE_COUNTS[sev]
              return (
                <div
                  key={sev}
                  className={`inline-flex items-baseline gap-[7px] bg-bg-1 border border-border border-l-[3px] ${meta.border} rounded-[6px] px-[14px] py-2`}
                >
                  <span className={`font-mono text-xl font-bold leading-none ${meta.text}`}>{count}</span>
                  <span className="font-mono text-[11px] tracking-[0.05em] text-text-dim">
                    {meta.glyph} {meta.label.toLowerCase()}
                  </span>
                </div>
              )
            })}
            <div className="ml-auto font-mono text-xs text-text-dimmer">
              commit <code className="text-accent-dim">3e9d127</code> · 10 findings
            </div>
          </div>

          {/* Example findings */}
          <div className="flex flex-col gap-3">
            {EXAMPLE_FINDINGS.map((f, i) => (
              <ExampleFinding key={f.title} finding={f} defaultOpen={i === 0} />
            ))}
          </div>
          <div className="text-center font-mono text-[12.5px] text-text-dimmer pt-4">
            + 7 more findings in the full report
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Paste a repo URL",
      text: "Any public GitHub repository. No signup, no OAuth, no access to your account.",
    },
    {
      n: "02",
      title: "Real engines scan it",
      text: "We run Semgrep and Gitleaks — the same tools security teams use — against your code and git history.",
    },
    {
      n: "03",
      title: "Get fixes in plain English",
      text: "Every finding comes with an AI explanation: what's wrong, how to fix it, why it matters.",
    },
  ]
  return (
    <section className="py-10 md:py-16" aria-labelledby="how-title">
      <div className="text-center mb-10">
        <h2 id="how-title" className="text-[clamp(24px,4vw,34px)] font-bold tracking-[-0.02em]">
          How it works
        </h2>
      </div>
      <ol className="list-none m-0 p-0 grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="bg-surface border border-border rounded-[10px] p-6">
            <span className="font-mono text-[13px] font-semibold text-accent tracking-[0.08em]">
              {s.n}
            </span>
            <h3 className="text-lg font-semibold mt-[10px] mb-1.5 tracking-[-0.01em]">{s.title}</h3>
            <p className="text-text-dim text-[14.5px] leading-[1.6] m-0">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function TrustSection({ stats }: { stats: Stats | null }) {
  const repoNum  = stats ? stats.repos_scanned.toLocaleString() : "—"
  const vulnNum  = stats ? stats.vulns_found.toLocaleString()   : "—"

  const displayStats = [
    { num: repoNum, lbl: "repos scanned"      },
    { num: vulnNum, lbl: "findings explained" },
    { num: "0",     lbl: "repos stored — ever" },
  ]

  return (
    <section className="py-10 md:py-16" aria-labelledby="trust-title">
      <h2 className="sr-only" id="trust-title">Trust</h2>

      {/* Stats */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-12 mb-10">
        {displayStats.map(({ num, lbl }) => (
          <div key={lbl} className="flex items-baseline gap-[9px]">
            <span className="font-mono text-[26px] font-bold tracking-[-0.02em] text-text">{num}</span>
            <span className="text-text-dimmer text-[13px]">{lbl}</span>
          </div>
        ))}
      </div>

      {/* Testimonial — hidden until we have a real quote */}

      {/* Built by */}
      <p className="text-center text-text-dim text-sm">
        Built by <strong className="text-text">Joris</strong>, CS student at TUHH Hamburg ·{" "}
        <a href="https://github.com/jorisnls" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          GitHub ↗
        </a>
        {" "}·{" "}
        <a href="https://linkedin.com/in/joris-nehls" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          LinkedIn ↗
        </a>
      </p>
    </section>
  )
}

function EmailCaptureSection() {
  return (
    <section className="pb-10 md:pb-16" aria-labelledby="email-title">
      <div className="bg-gradient-to-b from-surface to-bg-1 border border-border-2 rounded-[12px] px-6 py-9 text-center md:px-10 md:py-12">
        <h2
          id="email-title"
          className="text-[clamp(20px,3.5vw,26px)] font-bold tracking-[-0.02em]"
        >
          Private repo? Deployed app?
        </h2>
        <p className="text-text-dim text-[15px] max-w-[48ch] mt-[10px] mb-[22px] mx-auto">
          Private repo scanning and URL scanning are coming next. Leave your email and you&apos;ll be first in line.
        </p>
        <EmailCapture />
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-border py-7 flex flex-col gap-[10px] items-center text-center md:pb-10">
      <div className="flex flex-wrap justify-center gap-2 text-text-dimmer text-[13px]">
        <span>powered by</span>
        <code className="text-accent-dim">semgrep</code>
        <span>+</span>
        <code className="text-accent-dim">gitleaks</code>
        <span>+</span>
        <code className="text-accent-dim">llms</code>
      </div>
      <div className="flex flex-wrap justify-center gap-2 text-text-dimmer text-xs">
        <span>© 2026 vibe vetted</span>
        <span className="text-border-2" aria-hidden="true">·</span>
        <a
          href="https://www.flaticon.com"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-text-dim transition-colors"
        >
          icons by Flaticon
        </a>
        <span className="text-border-2" aria-hidden="true">·</span>
        <span>we never store your code</span>
      </div>
    </footer>
  )
}

// ─── sr-only helper ──────────────────────────────────────────────────────────

// (Tailwind has `sr-only` built in, used directly as className)

// ─── page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
  }, [])

  const triggerScan = async (scanUrl: string) => {
    if (loading) return
    const normalized = scanUrl.trim().replace(/^(https?:\/\/)?/, "https://")
    setLoading(true)
    setError(null)
    try {
      const { scan_id } = await startScan(normalized)
      router.push(`/results/${scan_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach backend")
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    triggerScan(url.trim())
  }

  const handleChip = (chipUrl: string) => {
    setUrl(chipUrl)
    triggerScan(chipUrl)
  }

  return (
    <div className="max-w-[1040px] mx-auto px-5 md:px-8">
      <SiteNav />
      <main>
        <Hero
          url={url}
          setUrl={setUrl}
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
          onChip={handleChip}
        />
        <ExampleReport />
        <HowItWorks />
        <TrustSection stats={stats} />
        <EmailCaptureSection />
      </main>
      <SiteFooter />
    </div>
  )
}
