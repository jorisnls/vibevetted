import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? ""

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 })
  }

  if (!AUDIENCE_ID) {
    return NextResponse.json({ error: "not configured" }, { status: 500 })
  }

  try {
    await resend.contacts.create({ email, audienceId: AUDIENCE_ID, unsubscribed: false })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[subscribe]", err)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
