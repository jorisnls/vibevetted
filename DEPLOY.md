# Deployment Plan

> Reflects the **actual** production setup as built (Hetzner VPS running
> Ubuntu 26.04, backend live at `https://api.vibevetted.tech`).

## Architecture

```
vibevetted.tech        → Vercel (Next.js frontend)
api.vibevetted.tech    → Hetzner VPS (FastAPI backend)
```

Code lives on GitHub. Push to main → GitHub Actions deploys backend to VPS,
Vercel auto-deploys frontend.

Two distinct Linux users are involved on the VPS, don't confuse them:

| User         | Role                                                        |
|--------------|-------------------------------------------------------------|
| `root`       | The **deploy/SSH user**. GitHub Actions connects as this.   |
| `vibevetted` | The **runtime user** the backend process runs as. Never logs in (`nologin`). |

Running the service as an unprivileged user limits the blast radius if a
malicious repo exploits one of the scanner tools. Deploying as `root` keeps the
CI/CD simple; `root` can write the `vibevetted`-owned repo because root bypasses
file permissions.

---

## Step 1 — Buy domain

- Buy `vibevetted.tech` at your registrar
- Move DNS to Cloudflare (free) for easy management

---

## Step 2 — DNS records (Cloudflare)

| Type  | Name  | Value                  | Purpose            |
|-------|-------|------------------------|--------------------|
| A     | `api` | your VPS IP            | backend            |
| A     | `@`   | `76.76.21.21`          | Vercel apex (root) |
| CNAME | `www` | `cname.vercel-dns.com` | Vercel www         |

> **Why an A record for `@` and not a CNAME?** DNS forbids a CNAME on the apex
> (root) domain. Vercel publishes a fixed apex IP (`76.76.21.21`) for this reason.
> Confirm the current value in Vercel → Domains after you add the domain in step 6.

Set all records to **Proxied: off** (grey cloud, "DNS only"). Cloudflare's proxy
in front of Vercel/Let's Encrypt can break domain verification and the cert's
HTTP-01 challenge. You can enable the proxy later once everything works.

---

## Step 3 — VPS one-time setup

SSH in as root and run the following.

### 3a. System packages

```bash
apt update && apt install -y git nginx certbot python3-certbot-nginx wget pipx

# Node 20 (only needed if you ever run the frontend on the VPS; Vercel handles it normally)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 3b. Python 3.11 (via deadsnakes PPA)

> **Why this is needed.** Ubuntu 26.04 ships Python **3.14** as the system
> Python, and `python3.11` is **not** in the default repos. Our
> `requirements.txt` pins `pydantic_core==2.23.4`, whose prebuilt wheels only go
> up to CPython 3.13. On 3.14 pip falls back to compiling it from Rust source
> and fails (`pyo3` max supported version is 3.13). So we install a real 3.11
> from the deadsnakes PPA and build the venv on that.

```bash
apt install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt update
apt install -y python3.11 python3.11-venv
```

### 3c. Scanner tools — semgrep (pipx) + gitleaks (binary)

> **Why semgrep goes through pipx, not the app venv.** Installing `semgrep` into
> the backend's venv drags in its own pinned `starlette`, `pydantic`, `uvicorn`,
> etc., which **conflict with FastAPI's** versions and break the app at import
> time. Keep semgrep in its own isolated environment and just expose it on
> `PATH`. `pipx` does exactly that — one venv per tool, symlinked onto `PATH`.

```bash
# Install semgrep into its own pipx env, with the launcher on the system PATH
export PIPX_HOME=/opt/pipx
export PIPX_BIN_DIR=/usr/local/bin
pipx install semgrep          # → /usr/local/bin/semgrep

# Gitleaks — resolve the latest release tag, then download that asset
GITLEAKS_VERSION=$(curl -fsSL https://api.github.com/repos/gitleaks/gitleaks/releases/latest | grep -oP '"tag_name":\s*"v\K[^"]+')
wget "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
tar -xzf "gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" && mv gitleaks /usr/local/bin/
```

Both `semgrep` and `gitleaks` now live in `/usr/local/bin`. The backend invokes
them as subprocesses, so that dir must be on the service's `PATH` (handled in the
unit file, step 4).

### 3d. Clone the repo and build the venv

```bash
git clone https://github.com/jorisnls/vibevetted.git /opt/vibevetted

cd /opt/vibevetted/backend
python3.11 -m venv venv
venv/bin/pip install --upgrade pip
venv/bin/pip install -r requirements.txt

# API key (the explainer uses the OpenAI API)
echo "OPENAI_API_KEY=sk-your-key-here" > /opt/vibevetted/backend/.env
```

### 3e. Runtime user + ownership + git trust

```bash
# Unprivileged service user (no shell, can't log in)
useradd -r -s /usr/sbin/nologin vibevetted

# semgrep writes a cache under $HOME, so the service user needs a real home dir
mkdir -p /home/vibevetted
chown vibevetted:vibevetted /home/vibevetted
chmod 700 /home/vibevetted

# Let the service user own the app
chown -R vibevetted:vibevetted /opt/vibevetted

# The deploy runs git as root against a vibevetted-owned repo. Git blocks that
# by default ("dubious ownership"); tell root's git to trust this one path.
git config --global --add safe.directory /opt/vibevetted
```

### 3f. Firewall (skip if UFW is inactive)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'   # opens 80 and 443
ufw --force enable
```

---

## Step 4 — Systemd service (backend)

Create `/etc/systemd/system/vibevetted-backend.service`:

```ini
[Unit]
Description=Vibe Vetted Backend
After=network.target

[Service]
WorkingDirectory=/opt/vibevetted/backend
EnvironmentFile=/opt/vibevetted/backend/.env
Environment=HOME=/home/vibevetted
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/opt/vibevetted/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
User=vibevetted
MemoryMax=1.4G
TasksMax=256

[Install]
WantedBy=multi-user.target
```

Why the non-obvious lines:
- `User=vibevetted` — run unprivileged (see architecture note).
- `Environment=HOME=/home/vibevetted` — without an explicit `HOME`, semgrep
  can't create its cache dir and crashes (`PermissionError: '/home/vibevetted'`).
- `Environment=PATH=/usr/local/bin:/usr/bin:/bin` — so the backend's
  `subprocess` calls can find `semgrep` and `gitleaks` in `/usr/local/bin`.
- `MemoryMax=1.4G` / `TasksMax=256` — caps so a runaway scan on a hostile repo
  can't exhaust the box.

```bash
systemctl daemon-reload
systemctl enable --now vibevetted-backend
systemctl status vibevetted-backend          # expect: active (running)
```

---

## Step 5 — Nginx + HTTPS

Create `/etc/nginx/sites-available/vibevetted`:

```nginx
server {
    server_name api.vibevetted.tech;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 180s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/vibevetted /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Free HTTPS cert (auto-renews). certbot rewrites the server block for 443.
certbot --nginx -d api.vibevetted.tech
```

Test it: `curl https://api.vibevetted.tech/health` should return `{"status":"healthy"}`.

---

## Step 6 — Vercel (frontend)

1. vercel.com → New Project → import the GitHub repo
2. Set **Root Directory** to `frontend`
3. Add env var: `NEXT_PUBLIC_BACKEND_URL` = `https://api.vibevetted.tech`
4. Deploy
5. Settings → Domains → add `vibevetted.tech`
6. Vercel shows a DNS value — confirm it matches the records in step 2

Vercel redeploys the frontend automatically on every push to main — no workflow needed.

---

## Step 7 — GitHub Actions (auto-deploy backend)

### 7a. Deploy SSH key

GitHub Actions authenticates to the VPS with a dedicated key (no passphrase, so
it can run unattended). On your **laptop**:

```bash
# Generate the keypair
ssh-keygen -t ed25519 -f ~/.ssh/vibevetted_deploy -C "github-actions-deploy" -N ""

# Put the PUBLIC half in root's authorized_keys on the VPS
ssh-copy-id -i ~/.ssh/vibevetted_deploy.pub root@YOUR_VPS_IP

# Verify passwordless login works
ssh -i ~/.ssh/vibevetted_deploy root@YOUR_VPS_IP "echo connected"

# Copy the PRIVATE half for the GitHub secret (macOS)
pbcopy < ~/.ssh/vibevetted_deploy
```

### 7b. GitHub secrets

repo → Settings → Secrets and variables → Actions:

| Secret        | Value                                              |
|---------------|----------------------------------------------------|
| `VPS_HOST`    | your VPS IP                                         |
| `VPS_USER`    | `root`                                              |
| `VPS_SSH_KEY` | the **private** key contents, incl. the `-----BEGIN/END-----` lines |

### 7c. The workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy backend

on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - ".github/workflows/deploy.yml"

concurrency:
  group: deploy-backend
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: SSH into VPS and update backend
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e
            cd /opt/vibevetted
            git fetch --depth=1 origin main
            git reset --hard origin/main
            cd backend
            venv/bin/pip install -r requirements.txt
            systemctl restart vibevetted-backend
```

Design notes:
- **No `actions/checkout`** — the runner is just a remote control. It SSHes in
  and the *server* pulls its own code. The runner never holds the repo.
- **`git fetch` + `git reset --hard`** instead of `git pull` — a deploy box
  should be an exact mirror of `main`, not a merge target. `reset --hard` can't
  hit merge conflicts from files that drifted on the server; it just overwrites.
- **`concurrency`** — queues overlapping deploys so two don't run at once.
- **`paths`** — skips the backend deploy on pure frontend changes (Vercel
  handles those). Remove the block to deploy on every push.
- **No `sudo`** — we connect as `root`, which already owns the right to restart
  the service and write the repo.

> **Dubious-ownership note.** Because `/opt/vibevetted` is owned by `vibevetted`
> but git runs as `root`, the first deploy fails until root trusts the path
> (done once in step 3e: `git config --global --add safe.directory
> /opt/vibevetted`). If you ever rebuild the VPS, redo that, or add it as the
> first line of the workflow's `script:` (it's idempotent).

---

## Normal dev workflow (after setup)

```bash
git add .
git commit -m "your message"
git push

# → Vercel redeploys frontend automatically
# → GitHub Actions SSHes into VPS, resets to origin/main, reinstalls deps,
#   restarts the backend
```

Verify a deploy landed:

```bash
# Service restarted just now?
ssh root@YOUR_VPS_IP "systemctl status vibevetted-backend --no-pager | head -5"

# Server on the same commit as GitHub?
ssh root@YOUR_VPS_IP "cd /opt/vibevetted && git log -1 --oneline"

# API healthy?
curl https://api.vibevetted.tech/health
```

---

## Proxy timeout note

Scans can take ~30s. The `proxy_read_timeout 180s` in Nginx covers this. The
frontend polls every 2s so the user sees progress regardless.
```
