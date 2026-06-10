from pathlib import Path
import subprocess
import json
import uuid
import re

from models.scan import Finding

SEMGREP_CONFIGS = [
    "p/javascript",
    "p/typescript",
    "p/python",
    "p/react",
    "p/nextjs",
    "p/security-audit",
]

# Rules with high false-positive rates that add more noise than signal.
BLOCKLISTED_RULE_IDS = {
    "javascript.lang.security.audit.logger-credential-leak",
    "python.lang.security.audit.logger-credential-leak",
    "generic.secrets.security.detected-generic-secret",
}

_INTENTIONAL_VULN_RE = re.compile(
    r'(?i)(intentionally.{0,10}vuln|deliberately.{0,10}vuln|'
    r'dvwa|juice.?shop|webgoat|hack.?me|ctf|capture.the.flag|'
    r'security.{0,10}(training|challenge|lab|exercise|demo))',
)

def _is_intentionally_vulnerable(repo_path: Path) -> bool:
    for filename in ("README.md", "README.txt", "README", "readme.md"):
        readme = repo_path / filename
        if readme.exists():
            try:
                content = readme.read_text(errors="ignore")[:4000]
                if _INTENTIONAL_VULN_RE.search(content):
                    return True
            except OSError:
                pass
    return False


def run_semgrep(repo_path: Path) -> list[Finding]:

    config_args = [arg for cfg in SEMGREP_CONFIGS for arg in ("--config", cfg)]

    result = subprocess.run(
        ['semgrep', *config_args, '--json', str(repo_path)],
        capture_output=True,
        text=True,
        timeout=120
    )

    data = json.loads(result.stdout)

    if _is_intentionally_vulnerable(repo_path):
        return []

    findings = []

    for r in data["results"]:
        rule_id = r["check_id"]
        if rule_id in BLOCKLISTED_RULE_IDS:
            continue

        metadata = r["extra"].get("metadata", {})
        if metadata.get("confidence", "").upper() == "LOW":
            continue

        severity_map = {"ERROR": "critical", "WARNING": "high"}
        severity = severity_map.get(r["extra"]["severity"].upper(), "medium")

        try:
            cwe = metadata["cwe"][0]
        except (KeyError, IndexError):
            cwe = None

        findings.append(Finding(
            id=str(uuid.uuid4()),
            tool="semgrep",
            severity=severity,
            title=rule_id,
            description=r["extra"]["message"],
            file_path=r["path"],
            line_number=r["start"]["line"],
            cwe=cwe
        ))

    return findings
