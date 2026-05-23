from datetime import datetime, timezone
import shutil

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

from scanner.gitleaks_runner import run_gitleaks
from scanner.semgrep_runner import run_semgrep
from scanner.clone import clone_repo
from models.scan import ScanResult, ScanStatus

class ScanRequest(BaseModel):
      repo_url: str

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

scans: dict[str, ScanResult] = {}

@app.get("/health")
def health():
      return {'status': 'healthy'}

@app.post("/scan")
def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
      if not request.repo_url.startswith('https://github.com/'):
            raise HTTPException(status_code=400, detail='Only GitHub URLs are supported')
      
      scan_id = str(uuid.uuid4())
      scans[scan_id] = ScanResult(scan_id=scan_id, status=ScanStatus.PENDING, repo_url=request.repo_url, created_at=datetime.now(timezone.utc).isoformat())
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

      except Exception as e:
        scans[scan_id].status = ScanStatus.FAILED
        scans[scan_id].error = str(e)
      
      finally:
        shutil.rmtree(f"/tmp/{scan_id}", ignore_errors=True)