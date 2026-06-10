# Vibe Vetted — Go-To-Market & Distribution Plan

> **Product:** Security scanner for vibe-coded repos. Paste a public GitHub URL → get real Semgrep + Gitleaks findings with Claude-generated, plain-English fixes.
> **Audience:** Solo devs & indie hackers shipping AI-built web apps without a security review.
> **Goal of this doc:** Get real users testing, collect actionable feedback, and convert early interest into paying customers.

---

## 0. The Strategic Bet (read this first)

You are not selling "a security scanner." Semgrep and Gitleaks are free and open-source — that's not your moat. **You are selling peace of mind for people who don't know what they don't know.**

The vibe-coder's actual pain isn't "I lack a SAST tool." It's: *"I shipped something AI wrote, and I have a nagging fear there's a hardcoded API key or an open endpoint in there, but I have no idea how to even check, and security tooling looks intimidating."*

Your wedge: **zero-friction + AI-explained fixes.** No install, no config, no CVE jargon. Paste URL → human answer. Everything below ladders up to that one message.

**Positioning one-liner (use this everywhere):**
> "Vibe Vetted scans your AI-built app for leaked secrets and security holes in 30 seconds — and explains every fix in plain English."

---

## 1. Pre-Launch Foundations (Week 0 — do before any promotion)

Don't drive traffic to something that can't capture or convert it. Lock these first:

- [ ] **Public scan result pages are shareable.** The `/results/{scanId}` page should be viewable without login and have OG meta tags (title, description, image). When someone scans their repo and shares it, that's free distribution. *This is your single highest-leverage feature.*
- [ ] **Email capture.** One field: "Get notified when private repo scanning launches." Even if you never build it, this measures demand and builds a launch list. Use a simple service (Resend, ConvertKit, or a Google Form for v0).
- [ ] **A "famous repo" gallery.** Pre-run scans on 5–10 popular open-source / template repos (e.g. common Next.js starters, viral "I built X with AI" repos). Findings on real, recognizable code are *instant credibility and instant shareability.* (Be tactful — frame as "common patterns," don't dunk on individuals.)
- [ ] **Analytics from day one.** Plausible or PostHog. Track: scans started, scans completed, results shared, email signups. You cannot improve what you don't measure.
- [ ] **A clear "what next" on the results page.** After findings, what do you want them to do? (Share, sign up for updates, scan another repo.) Add the CTA.

---

## 2. The Feedback Engine (first 20–50 users)

Your first job is **learning, not scaling.** Get to ~30 real conversations.

### Where to find your first 30 testers
1. **Your own network first.** DM 10 dev friends directly: *"Built a thing that scans AI-coded repos for security issues. Can you run it on one of your projects and tell me if the results are useful or garbage? 2 min."* Direct asks convert 10x better than broadcasts.
2. **Indie Hackers / r/SideProject / r/webdev "show what you built" threads.** Low stakes, supportive audiences.
3. **Discord/Slack communities** where the audience literally lives:
   - Cursor Discord, Claude / Anthropic Discord, Bolt.new, v0, Lovable, Replit communities — these people *are* vibe coders by definition.
   - Indie Hackers, WIP.co, Buildspace / startup-school communities.
4. **Twitter/X DMs** to people posting "I built X with Cursor/Claude in a weekend."

### What to ask (structured feedback beats "what do you think?")
Send every tester the same 4 questions:
1. Were the findings *accurate* — or did you see false positives?
2. Did the AI fix explanations actually help you understand the problem? (yes / sort of / no)
3. Did you fix anything because of this scan?
4. Would you pay for this? If yes, for what exactly (private repos? CI integration? re-scans?)

> **Why structured:** Q1 validates the tech, Q2 validates your *differentiation*, Q3 validates real value (did behavior change?), Q4 validates willingness-to-pay. Question 4's *"for what"* tells you what to build/charge for.

### Make feedback effortless
- Add a one-click "👍 helpful / 👎 not helpful" on each finding card. Passive feedback at scale beats surveys.
- Add a tiny "Was this scan useful?" prompt on the results page linking to a 60-sec form.

---

## 3. Launch Sequence (the public push)

Order matters. Warm up small communities → build proof → then hit the big launch surfaces.

### Phase A — Soft launch (Weeks 1–2)
- Post in the niche communities from §2.3. Goal: 50–100 scans, fix bugs, gather testimonials/screenshots.
- Collect 2–3 quotes you can use ("Found a hardcoded Stripe key I forgot about" is marketing gold).

### Phase B — Content proof (Weeks 2–4)
Ship 1–2 pieces of "data + story" content. This is the engine that keeps working after launch day:
- **"I scanned 100 'I built it with AI' repos. Here's what I found."** Aggregate, anonymized stats: % with leaked secrets, most common vuln, scariest finding. This is *extremely* shareable and is the kind of post that gets picked up.
- **"The 5 security mistakes every Cursor/Claude-built app has"** — listicle, each item ends with "scan yours to check."
- Each post's CTA: scan your repo.

### Phase C — Big launch (Week 4+)
- **Product Hunt.** Launch Tue–Thu. Have your network lined up *in advance* (PH discourages "go upvote me" but you can notify people you launched). Assets needed: gallery GIF of a scan running, the "100 repos" data as a talking point, founder comment explaining the *why*.
- **Hacker News (Show HN).** *"Show HN: I scan AI-coded repos for leaked secrets and security holes."* HN loves: technical honesty, a free useful tool, and a security angle. Be present in comments all day, be humble, admit limitations (it's Semgrep+Gitleaks+Claude — say so, the transparency plays well). HN can deliver thousands of devs in a day.
- **Reddit:** r/webdev, r/SideProject, r/programming (careful — strict), r/cybersecurity (if framed for builders not pros).
- **Twitter/X thread** built around the "100 repos" data, not the product. Data travels; ads don't.

> **Sequencing logic:** You launch on PH/HN *with* the data story and *with* testimonials already in hand. Launching cold wastes your one shot. Proof first, megaphone second.

---

## 4. Sustainable Distribution Channels (post-launch flywheels)

Launches spike; flywheels compound. Build at least two of these:

### A. The shareable-result loop (highest priority)
Every scan produces a public, OG-tagged result page. A dev shares "look what Vibe Vetted found in my repo" → their followers click → scan their own → share. Make sharing a *one-click button* with pre-filled text: *"Just scanned my app with @vibevetted — found N issues 😳"*. **This is your cheapest, most scalable channel. Invest here over ads.**

### B. SEO / programmatic content
- Long-tail intent: "how to find hardcoded API keys in my repo", "is my Next.js app secure", "Cursor app security checklist".
- Programmatic pages: "Security guide for [Stripe keys / Supabase / Firebase / env files] in [Next.js / React]." Each maps to a finding type you detect.

### C. The "badge" play
Offer a **"Vetted by Vibe Vetted" badge** for READMEs/landing pages once a repo passes a clean scan. Badges in READMEs = backlinks + free brand exposure on every repo that uses one. (Shields.io-style.) This turns users into billboards.

### D. Where the vibe coders already are
- Be genuinely helpful (not spammy) in Cursor/Claude/Lovable/Bolt/v0/Replit communities. When someone asks "is my app safe to deploy?" — you have the answer.
- Tutorial collabs / shoutouts with AI-coding YouTubers and newsletter writers (e.g. people teaching "build a SaaS with Cursor"). A security step fits naturally into their content.

---

## 5. Path to Revenue

The free tool (public repos) is your top-of-funnel. Monetize the things the serious user needs:

| Tier | Who | What they get | Why they pay |
|------|-----|---------------|-------------|
| **Free** | Everyone | Public repo scans, AI fixes (capped) | Acquisition + virality |
| **Pro** (~$9–19/mo) | Indie hackers with real apps | **Private repo scanning** (GitHub OAuth), unlimited scans/findings, full AI explanations, scan history | They can't expose a private repo to a public tool — this is the natural paywall |
| **Ship** (~$29–49/mo) | Devs shipping continuously | CI/CD integration (PR comment bot / GitHub Action), scheduled re-scans, "block deploy if critical" | Security as part of their pipeline, not a one-off |
| **Team/Agency** (later) | Dev shops building for clients | Multi-repo dashboard, client reports/PDF, white-label badge | Sell security as a deliverable to *their* clients |

**Monetization logic:**
- **Private repos = the obvious paywall.** Your whole audience builds private things. They literally cannot use the free tool for their real product → clean upgrade trigger.
- **CI/CD = retention.** A one-time scan churns. A bot that comments on every PR becomes infrastructure they won't remove.
- **Don't charge for the AI explanation as a feature** — that's your differentiator, keep it visible everywhere. Charge for *scope* (private/unlimited) and *workflow* (CI/history).

**Validate price before building:** the §2 feedback Q4 + the §1 email-capture waitlist tell you if private-repo scanning has demand *before* you build OAuth.

---

## 6. Messaging & Copy Bank

**Headlines (test these):**
- "Did your AI leave a security hole in your app? Find out in 30 seconds."
- "You vibe-coded it. We vetted it."
- "Scan your AI-built app for leaked secrets — before someone else does."

**The hook that works for this audience:** *fear + ease.* They know AI-generated code is sketchy; they just don't have an easy way to check. Lead with the specific fear (leaked API keys, exposed endpoints), close with the ease (paste URL, done).

**Avoid:** enterprise security jargon ("SAST", "SCA", "shift-left", "CVE remediation"). Your user is scared *of* that vocabulary. Speak like a helpful senior dev friend, not a security vendor.

**Social proof to collect & display:** "Found a leaked key in N% of repos we scanned." Specific numbers > adjectives.

---

## 7. 30-Day Execution Checklist

**Week 1 — Foundation + first feedback**
- [ ] Ship shareable result pages w/ OG tags + email capture
- [ ] Add analytics + per-finding 👍/👎
- [ ] Pre-scan 10 famous repos for the gallery
- [ ] DM 10 friends, get 10 real scans + structured feedback
- [ ] Fix the top 3 issues they surface

**Week 2 — Soft launch + proof**
- [ ] Post in 5 niche communities (Cursor/Claude/IH/Reddit)
- [ ] Hit 100 scans; collect 3 testimonials + 1 "scary finding" screenshot
- [ ] Start aggregating the "100 repos" dataset

**Week 3 — Content**
- [ ] Publish "I scanned 100 AI-built repos" post + X thread
- [ ] Publish the "5 mistakes" listicle
- [ ] Stand up the email waitlist for private-repo scanning

**Week 4 — Big launch**
- [ ] Product Hunt (Tue–Thu) + Show HN, same week
- [ ] Be present in every comment thread all day
- [ ] Measure: scans, shares, signups, waitlist conversions → decide what to build next based on data

---

## 8. North-Star Metrics

| Metric | Why it matters |
|--------|---------------|
| **Scans completed / week** | Top-of-funnel health |
| **Share rate** (results shared / scans) | Is the virality loop working? |
| **Findings → "helpful" rate** | Is your differentiator (AI fixes) landing? |
| **Waitlist signups** | Demand for the paid (private-repo) product |
| **Activation: % who scan a *second* repo** | Real value signal — they came back |

> Pick **one** focus metric per phase. Pre-launch: completed scans. Launch: share rate. Monetization: waitlist → paid conversion. Don't optimize everything at once.

---

## TL;DR
1. Make results **public + shareable** — that's the growth engine, not ads.
2. Get **30 structured feedback conversations** before scaling anything.
3. Launch with **proof** (the "100 repos" data + testimonials), not cold.
4. The **AI-explained fix is your moat** — keep it free and visible; monetize **private repos + CI/CD**.
5. Speak to **fear + ease**, never security jargon.
