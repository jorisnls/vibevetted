"use client"

import { useState } from "react"

export default function EmailCapture() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setState(res.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <p className="text-accent text-sm">
        <span className="text-text-dim">$</span> you&apos;re on the list.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 flex-wrap">
      <span className="text-text-dim text-sm select-none">$</span>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="bg-bg-1 border border-border rounded-[5px] px-3 py-2.5 text-sm text-text placeholder:text-text-dimmer focus:outline-none focus:border-accent transition-colors duration-[120ms] w-full sm:w-56"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="text-accent text-xs px-4 py-2.5 border border-accent-dim bg-accent-bg rounded-[5px] hover:bg-accent hover:text-bg active:scale-[0.98] transition-[background,color,transform] duration-[120ms] disabled:opacity-50"
      >
        {state === "loading" ? "..." : "notify me"}
      </button>
      {state === "error" && (
        <span className="text-sev-crit text-xs">something went wrong</span>
      )}
    </form>
  )
}
