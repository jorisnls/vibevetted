import subprocess
from pathlib import Path


def clone_repo(repo_url: str, scan_id: str) -> Path:
    target = Path(f"/tmp/{scan_id}")

    result = subprocess.run(
        ["git", "clone", "--depth=1", repo_url, str(target)],
        capture_output=True,
        text=True,
        timeout=60,
    )

    if result.returncode != 0:
        raise RuntimeError(f"git clone failed: {result.stderr}")

    return target
