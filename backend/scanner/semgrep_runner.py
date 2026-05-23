from pathlib import Path
import subprocess
import json
import uuid

from models.scan import Finding

def run_semgrep(repo_path: Path) -> list[Finding]:

    result = subprocess.run(
        ['semgrep', '--config', 'p/javascript', '--config', 'p/typescript', '--json', str(repo_path)],
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
