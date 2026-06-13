import type { Metadata, Viewport } from "next"
import { Geist, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  title: "Vibe Vetted — Free Security Scan for AI-Generated Code",
  description:
    "Paste a public GitHub repo and get a security report in 30 seconds. Real Semgrep + Gitleaks scanning with plain-English AI fixes. Built for Cursor, Lovable, and Bolt projects.",
  openGraph: {
    type: "website",
    siteName: "Vibe Vetted",
    title: "Vibe Vetted — Free Security Scan for AI-Generated Code",
    description:
      "Paste a public GitHub repo and get a security report in 30 seconds. Real Semgrep + Gitleaks scanning with plain-English AI fixes.",
    images: [{ url: "/og-image.png" }],
    url: "https://vibevetted.com/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Vetted — Free Security Scan for AI-Generated Code",
    description:
      "Paste a public GitHub repo and get a security report in 30 seconds. Real Semgrep + Gitleaks scanning with plain-English AI fixes.",
    images: ["/og-image.png"],
  },
}

// viewport-fit=cover lets env(safe-area-inset-*) work for notch / home-bar
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg text-text font-sans antialiased">
        {/* z-[2] keeps content above the fixed z-1 scanline overlay */}
        <div className="relative z-[2]">{children}</div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
