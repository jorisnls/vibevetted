from pathlib import Path
import subprocess
import uuid
import json

from models.scan import Finding


def run_gitleaks(repo_path: Path) -> list[Finding]:
    result = subprocess.run(
        ['gitleaks', 'dir', '--report-format', 'json', '--report-path', '-', str(repo_path)],
        capture_output=True,
        text=True,
        timeout=60
    )

    if result.returncode == 0: return []
    if result.returncode == 126: raise RuntimeError(f"gitleaks failed: {result.stderr}")

    if not result.stdout.strip(): return []
    data = json.loads(result.stdout)
    findings = []

    for item in data:
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