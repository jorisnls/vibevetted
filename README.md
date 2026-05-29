# Vibe Vetted

**Security scanner for vibe-coded apps.**

Paste a public GitHub URL, and Vibe Vetted clones the repo, runs real static analysis tools (Semgrep + Gitleaks), and uses an LLM to generate concrete fix explanations for every finding — grouped by severity.

Built for solo devs and indie hackers who ship fast with AI tools but skip the security review. Focuses on JavaScript/TypeScript — the most common stack for vibe-coded apps.

> This project grew out of my bachelor's thesis on the security of agentic AI-generated code. I vibe code myself, noticed the problem firsthand, and wanted a tool that actually exists.

---

## What it does

- Detects JS/TS vulnerabilities via **Semgrep** (XSS, injection, insecure dependencies, etc.)
- Finds leaked secrets via **Gitleaks** (API keys, tokens, credentials committed to git)
- Generates a **plain-English fix explanation** per finding using an LLM — not just "this is bad", but what to change and why
- Groups findings by severity: Critical → High → Medium → Low

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Python 3.11, FastAPI |
| Scanning | Semgrep, Gitleaks |
| LLM | OpenAI API |

## Running locally

Copy the example env files and fill in your values:

```bash
# Backend
cp .env.example backend/.env
# edit backend/.env and add your OPENAI_API_KEY

# Frontend
cp .env.example frontend/.env.local
# NEXT_PUBLIC_BACKEND_URL is already set to http://localhost:8000
```

**Backend**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and paste any public GitHub repo URL.

## Requirements

- `semgrep` installed and on PATH (`pip install semgrep`)
- `gitleaks` installed and on PATH ([releases](https://github.com/gitleaks/gitleaks/releases))
- An `OPENAI_API_KEY`

---

Built by [Joris Nehls](https://github.com/jorisnls)
