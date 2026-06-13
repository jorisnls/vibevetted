"use client"

import { useState } from "react"

export default function EmailCapture() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setState("error")
      return
    }
    setState("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      setState(res.ok ? "done" : "error")
    } catch {
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <p className="font-mono text-accent text-sm">
        <span aria-hidden="true">✓</span> You&apos;re on the list. We&apos;ll only email you when it ships.
      </p>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-[440px] mx-auto" noValidate>
        <label className="sr-only" htmlFor="waitlist-email">Email address</label>
        <input
          id="waitlist-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle") }}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={state === "error"}
          className="flex-1 min-w-0 bg-bg border border-border-2 rounded-[8px] text-text font-mono text-sm px-[14px] py-3 outline-none transition-colors duration-150 focus:border-accent-dim placeholder:text-text-dimmer"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="bg-accent text-bg font-semibold text-sm px-5 rounded-[8px] whitespace-nowrap transition-[background] duration-150 hover:bg-[#95ffae] active:scale-[0.98] disabled:opacity-70 cursor-pointer"
        >
          {state === "loading" ? "…" : "Notify me"}
        </button>
      </form>
      {state === "error" && (
        <p className="text-sev-crit text-[13px] mt-[10px]" role="alert">
          That doesn&apos;t look like an email address.
        </p>
      )}
    </div>
  )
}
