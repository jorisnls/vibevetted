from enum import Enum
from typing import Optional
from pydantic import BaseModel


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
    tool: str  # "semgrep" | "gitleaks"
    severity: Severity
    title: str
    description: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    fix_explanation: str = ""
    cwe: Optional[str] = None


class ScanResult(BaseModel):
    scan_id: str
    status: ScanStatus
    repo_url: str
    findings: list[Finding] = []
    summary: dict = {}
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None
