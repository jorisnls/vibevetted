import type { Metadata } from "next"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scanId: string }>
}): Promise<Metadata> {
  const { scanId } = await params

  try {
    const res = await fetch(`${BACKEND_URL}/scan/${scanId}`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      if (data.status === "done") {
        const total: number = data.findings?.length ?? 0
        const repo: string = (data.repo_url as string).replace(/^https?:\/\/github\.com\//, "")
        const title = `${repo} — ${total} findings | Vibe Vetted`
        const description = `Security scan found ${total} issue${total !== 1 ? "s" : ""} in ${repo}. AI-explained fixes included.`
        return {
          title,
          description,
          openGraph: { title, description },
          twitter: { card: "summary", title, description },
        }
      }
    }
  } catch {}

  return {
    title: "Scan Results | Vibe Vetted",
    description: "Security scanner for vibe-coded apps. AI-explained fixes for every finding.",
  }
}

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
