from datetime import datetime, timezone
import shutil
import threading

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from llm.explainer import explain_findings
from scanner.gitleaks_runner import run_gitleaks
from scanner.semgrep_runner import run_semgrep
from scanner.clone import clone_repo
from models.scan import ScanResult, ScanStatus
import stats as stats_db

class ScanRequest(BaseModel):
      repo_url: str

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

stats_db.init_db()
scans: dict[str, ScanResult] = {}

MAX_CONCURRENT_SCANS = 5
_scan_slots = threading.BoundedSemaphore(MAX_CONCURRENT_SCANS)

@app.get("/stats")
def get_stats():
    return stats_db.get_stats()

@app.get("/health")
def health():
      return {'status': 'healthy'}

@app.post("/scan")
@limiter.limit("5/minute")
def start_scan(request: Request, scan_request: ScanRequest, background_tasks: BackgroundTasks):
      if not scan_request.repo_url.startswith('https://github.com/'):
            raise HTTPException(status_code=400, detail='Only GitHub URLs are supported')

      if not _scan_slots.acquire(blocking=False):
            raise HTTPException(status_code=503, detail='Server is at capacity, please try again in a moment')

      scan_id = str(uuid.uuid4())
      scans[scan_id] = ScanResult(scan_id=scan_id, status=ScanStatus.PENDING, repo_url=scan_request.repo_url, created_at=datetime.now(timezone.utc).isoformat())
      background_tasks.add_task(run_scan, scan_id)

      return {'scan_id': scan_id, 'status': 'pending'}

@app.get("/scan/{scan_id}")
def get_scan(scan_id:str):
      if scan_id not in scans:
            raise HTTPException(status_code=404, detail='Scan not found')
      
      return scans[scan_id]

def run_scan(scan_id:str):
      scans[scan_id].status = ScanStatus.RUNNING
      findings = []
      
      try:
        repo = clone_repo(scans[scan_id].repo_url, scan_id)
        
        findings+= run_semgrep(repo)
        findings+= run_gitleaks(repo)
        findings = explain_findings(findings)
        
        scans[scan_id].status = ScanStatus.DONE
        scans[scan_id].findings = findings
        scans[scan_id].summary = {
            "total": len(findings),
            "critical": sum(1 for f in findings if f.severity.value == "critical"),
            "high": sum(1 for f in findings if f.severity.value == "high"),
            "medium": sum(1 for f in findings if f.severity.value == "medium"),
            "low": sum(1 for f in findings if f.severity.value == "low"),
        }
        scans[scan_id].completed_at = datetime.now(timezone.utc).isoformat()
        stats_db.increment(repos=1, vulns=len(findings))

      except Exception as e:
        scans[scan_id].status = ScanStatus.FAILED
        scans[scan_id].error = str(e)
      
      finally:
        shutil.rmtree(f"/tmp/{scan_id}", ignore_errors=True)
        _scan_slots.release()