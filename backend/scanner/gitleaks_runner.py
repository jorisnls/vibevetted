from pathlib import Path
import subprocess
import uuid
import json
import math
import re

from models.scan import Finding

_CONFIG_PATH = Path(__file__).parent / "gitleaks.toml"

_PLACEHOLDER_RE = re.compile(
    r'(?i)(your[-_]?api|your[-_]?secret|your[-_]?token|example|placeholder|changeme|'
    r'replace.?me|insert.?here|fake|dummy|sample|test[-_]?key|demo[-_]?key|'
    r'<[A-Z_]+>|\$\{[A-Z_]+\}|\{\{[^}]+\}\}|^x+$|^0+$|^1+$)',
    re.IGNORECASE
)

def _entropy(s: str) -> float:
    if not s:
        return 0.0
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    length = len(s)
    return -sum((f / length) * math.log2(f / length) for f in freq.values())

def _is_likely_placeholder(secret: str) -> bool:
    if not secret or len(secret) < 8:
        return True
    if _PLACEHOLDER_RE.search(secret):
        return True
    # Low entropy = not a real secret (real API keys are highly random)
    if _entropy(secret) < 2.5:
        return True
    return False


def run_gitleaks(repo_path: Path) -> list[Finding]:
    cmd = ['gitleaks', 'dir', '--report-format', 'json', '--report-path', '-']
    if _CONFIG_PATH.exists():
        cmd += ['--config', str(_CONFIG_PATH)]
    cmd.append(str(repo_path))

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

    if result.returncode == 0:
        return []
    if result.returncode == 126:
        raise RuntimeError(f"gitleaks failed: {result.stderr}")
    if not result.stdout.strip():
        return []

    data = json.loads(result.stdout)
    findings = []

    for item in data:
        secret = item.get("Secret", "")
        if _is_likely_placeholder(secret):
            continue

        findings.append(Finding(
            id=str(uuid.uuid4()),
            tool='gitleaks',
            severity='critical',
            title=item["RuleID"],
            description=item["Description"],
            file_path=item["File"],
            line_number=item["StartLine"],
            cwe='CWE-798: Use of Hard-coded Credentials'
        ))

    return findings
