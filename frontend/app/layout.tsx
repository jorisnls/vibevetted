import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  title: "Vibe Vetted",
  description: "Security scanner for vibe-coded apps",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="min-h-screen bg-bg text-text font-mono antialiased">
        {/* z-[2] keeps content above the fixed z-1 scanline overlay */}
        <div className="relative z-[2]">{children}</div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
