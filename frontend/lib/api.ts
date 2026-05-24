const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export type Severity = "critical" | "high" | "medium" | "low"
export type ScanStatus = "pending" | "running" | "done" | "failed"

export type Finding = {
    id: string
    tool: string
    severity: Severity
    title: string
    description: string
    file_path: string | null
    line_number: number | null
    fix_explanation: string
    cwe: string | null
}

export type ScanResult = {
    scan_id: string
    status: ScanStatus
    repo_url: string
    findings: Finding[]
    summary: Record<string, number>
    error: string | null
    created_at: string
    completed_at: string | null
}

export async function startScan(repoUrl: string): Promise<{ scan_id: string}> {
    const res = await fetch(`${BACKEND_URL}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl})
    })

    if (!res.ok) throw new Error(await res.text())
    return res.json()
}

export async function getScanResult(scanId:string): Promise<ScanResult> {
    const res = await fetch(`${BACKEND_URL}/scan/${scanId}`)

    if (!res.ok) throw new Error(await res.text())
    return res.json()
}