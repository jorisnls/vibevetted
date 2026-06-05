from pathlib import Path
import subprocess
import json
import uuid

from models.scan import Finding

# Semgrep registry rulesets to run. semgrep only applies a ruleset's rules to
# files of the matching language, so listing a language a repo doesn't use is
# cheap (rules load but match nothing) — the real cost is rule-loading time and
# first-run network fetch from the registry, which is why we curate rather than
# scan "everything".
SEMGREP_CONFIGS = [
    # Core vibe-coded stack: JS/TS dominate, Python is the clear runner-up.
    "p/javascript",
    "p/typescript",
    "p/python",
    # Framework rules catch the bugs that generic language rules miss
    # (e.g. Next.js/React data-flow, Express misconfig) — high signal for
    # exactly the apps this tool targets.
    "p/react",
    "p/nextjs",
    # Broad security pass across whatever else is in the repo.
    "p/security-audit",
]


def run_semgrep(repo_path: Path) -> list[Finding]:

    config_args = [arg for cfg in SEMGREP_CONFIGS for arg in ("--config", cfg)]

    result = subprocess.run(
        ['semgrep', *config_args, '--json', str(repo_path)],
        capture_output=True,
        text=True,
        timeout=120
    )

    data = json.loads(result.stdout)
    findings = []

    for r in data["results"]:
        severity_map = {
            "ERROR": "critical",
            "WARNING": "high"
        }
        raw_severity = r["extra"]["severity"].upper()
        severity = severity_map.get(raw_severity, "medium")

        try:
            cwe = r["extra"]["metadata"]["cwe"][0]
        except (KeyError, IndexError):
            cwe = None

        findings.append(Finding(
            id=str(uuid.uuid4()),
            tool = "semgrep",
            severity=severity,
            title=r["check_id"],
            description=r["extra"]["message"],
            file_path=r["path"],
            line_number=r["start"]["line"],
            cwe=cwe
        ))
    
    return findings
