# Vibe Vetted — Claude Code Spec (MVP)

## Was es ist

**Vibe Vetted** — Security-Scanner für vibe-coded Repos.

Nutzer gibt eine öffentliche GitHub-URL ein. Das Backend klont das Repo, führt echte Static-Analysis-Tools aus (Semgrep, Gitleaks), und gibt strukturierte Security-Findings zurück. Claude generiert pro Finding eine konkrete Fix-Erklärung. Das Frontend zeigt die Ergebnisse gruppiert nach Severity.

**Zielgruppe:** Solo-Devs und Indie-Hacker die mit AI-Tools (Claude Code, Cursor) schnell Web-Apps bauen und deployen — ohne Security-Review.

---

## Tech Stack

```
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Backend:   Python 3.11 + FastAPI
Tools:     Semgrep (JS/TS vulns) + Gitleaks (secrets)
LLM:       Anthropic Claude [model TBD] für Fix-Erklärungen
Deploy:    Hetzner VPS (kein Docker für MVP)
CI/CD:     GitHub Actions (git pull + systemd restart)
```

---

## Ordnerstruktur

```
vibe-vetted/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing + URL Input
│   │   └── results/[scanId]/page.tsx   # Results mit Polling
│   ├── components/
│   │   ├── ScanInput.tsx
│   │   ├── FindingCard.tsx
│   │   ├── SeverityBadge.tsx
│   │   ├── LoadingState.tsx
│   │   └── ScanSummary.tsx
│   ├── lib/
│   │   └── api.ts
│
├── backend/
│   ├── main.py
│   ├── models/scan.py
│   ├── scanner/
│   │   ├── clone.py
│   │   ├── semgrep_runner.py
│   │   └── gitleaks_runner.py
│   ├── llm/explainer.py
│   ├── requirements.txt
│   └── .env
│
├── .env.example
├── .github/workflows/deploy.yml
└── README.md
```

---

## Datenmodelle (`backend/models/scan.py`)

```python
class Severity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ScanStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"

class Finding(BaseModel):
    id: str
    tool: str                 # "semgrep" | "gitleaks"
    severity: Severity
    title: str
    description: str
    file_path: Optional[str]
    line_number: Optional[int]
    fix_explanation: str      # Generiert von Claude
    cwe: Optional[str]

class ScanResult(BaseModel):
    scan_id: str
    status: ScanStatus
    repo_url: str
    findings: list[Finding] = []
    summary: dict = {}        # {"total": 5, "critical": 1, "high": 2, ...}
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None
```

---

## Backend Endpoints (`backend/main.py`)

**POST `/scan`**
- Input: `{"repo_url": "https://github.com/user/repo"}`
- Validierung: muss mit `https://github.com/` beginnen
- Generiert UUID als scan_id
- Speichert State in In-Memory-Dict (kein DB für MVP)
- Startet Scan als FastAPI BackgroundTask
- Gibt sofort zurück: `{"scan_id": "...", "status": "pending"}`

**GET `/scan/{scan_id}`**
- Gibt aktuellen Status + Results zurück
- Frontend pollt alle 2 Sekunden bis status "done" oder "failed"

**GET `/health`**
- Gibt `{"status": "ok"}` zurück

**CORS:** `allow_origins=["*"]` für MVP.

---

## Background Task Flow

```
1.  Status → "running"
2.  Repo klonen nach /tmp/{scan_id}/ (git clone --depth=1, timeout 60s)
3.  Semgrep ausführen (p/javascript + p/typescript ruleset, JSON output, timeout 120s)
4.  Gitleaks ausführen (JSON output, timeout 60s)
5.  Alle Findings aggregieren
6.  Claude: Fix-Erklärung pro Finding generieren (max 10 Findings — Kostenkontrolle)
7.  Status → "done"
8.  /tmp/{scan_id}/ aufräumen (shutil.rmtree in finally-Block — auch bei Fehler)
→   Bei jedem Fehler: Status → "failed", error message speichern
```

**Wichtig:** Semgrep gibt exit code 1 zurück wenn Findings gefunden werden — das ist kein Fehler. Immer stdout parsen, nie exit code prüfen.

---

## LLM Prompt (`backend/llm/explainer.py`)

Pro Finding diesen Prompt verwenden, Response direkt als `fix_explanation` speichern:

```
You are a security expert helping indie hackers understand and fix security issues in their vibe-coded apps.

Explain this finding concisely in English (max 150 words total):

Tool: {tool}
Severity: {severity}
Title: {title}
Description: {description}
File: {file_path}
Line: {line_number}
CWE: {cwe}

Respond in EXACTLY this format:

**What's wrong:** [1-2 sentences]

**How to fix it:** [Concrete fix, with code snippet if applicable]

**Why it matters:** [1 sentence on why vibe-coded apps often have this]
```

---

## Frontend Verhalten

**`app/page.tsx`:**
- Logo "Vibe Vetted" + Subtitle "Security scanner for vibe-coded apps"
- ScanInput Komponente zentral
- Submit → POST `/scan` → redirect zu `/results/{scanId}`

**`app/results/[scanId]/page.tsx`:**
- Polling: GET `/scan/{scanId}` alle 2 Sekunden (useEffect + setInterval, cleanup nicht vergessen)
- Loading: Animated indicator + "Cloning... Running Semgrep... Checking secrets..."
- Done: ScanSummary oben, dann FindingCards gruppiert nach Severity (Critical → High → Medium → Low)
- Failed: Error message + "Try another repository" Button

**`components/FindingCard.tsx` zeigt:**
- Severity Badge (farbkodiert: rot/orange/gelb/blau)
- Tool Badge
- Title + File Path + Line (monospace)
- Fix Explanation prominent (das ist der Hauptwert)
- CWE Link zu cwe.mitre.org falls vorhanden

**Design:** Dunkles Theme, Terminal-inspired, monospace für Code-Pfade. Kein generisches SaaS-Look.

**`lib/api.ts`:**
```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export async function startScan(repoUrl: string): Promise<{ scan_id: string }>
export async function getScanResult(scanId: string): Promise<ScanResult>
```

---

## Deploy (kein Docker für MVP)

**Lokal starten:**
```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

**VPS Setup (einmalig):**
- Python 3.11, Node 20, git, semgrep, gitleaks installieren
- Backend als systemd service (`uvicorn main:app --host 0.0.0.0 --port 8000`)
- Frontend als systemd service (`next start --port 3000`)
- `ANTHROPIC_API_KEY` in `/etc/environment` oder backend `.env`

## CI/CD (`.github/workflows/deploy.yml`)

Trigger: push to main
Job: SSH in VPS → git pull → systemctl restart backend frontend

GitHub Secrets needed: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `ANTHROPIC_API_KEY`

---

## Session-Aufteilung für Claude Code

**Lernhinweis für alle Sessions:** Der Nutzer studiert CS und will verstehen was gebaut wird. Code generieren ist ok, aber bei nicht-offensichtlichen Entscheidungen kurz erklären: warum dieser Ansatz, was die Tradeoffs sind, was man hier lernen kann.

**Session 1 — Backend Core:**
> "Implementiere das Backend für Vibe Vetted nach dieser Spec. Fang mit models/scan.py, dann scanner/clone.py, dann semgrep_runner.py an. Noch kein LLM, kein Frontend. Am Ende soll ich mit curl einen Test-Request machen können. Erkläre bei wichtigen Entscheidungen kurz das Warum — ich studiere CS und will verstehen was ich baue, nicht nur Code generieren."

**Session 2 — Backend komplett:**
> "Füge gitleaks_runner.py und llm/explainer.py hinzu. Dann implementiere main.py mit den drei Endpoints und der Background Task Logic. Rate limiting: max 5 gleichzeitige Scans (einfacher Counter reicht). Erkläre bei wichtigen Entscheidungen kurz das Warum — ich studiere CS und will verstehen was ich baue."

**Session 3 — Frontend:**
> "Implementiere das Next.js Frontend nach der Spec. Dunkles Terminal-Theme, monospace für Code-Pfade, Severity-Farben rot/orange/gelb/blau. Erkläre bei wichtigen Entscheidungen kurz das Warum — ich studiere CS und will verstehen was ich baue."

**Session 4 — CI/CD:**
> "Erstelle den GitHub Actions Workflow für automatisches Deployment auf Hetzner VPS via SSH. Kein Docker — Backend und Frontend laufen als systemd services. Der Workflow macht git pull und startet beide Services neu. Erkläre bei wichtigen Entscheidungen kurz das Warum — ich studiere CS und will verstehen was ich baue."